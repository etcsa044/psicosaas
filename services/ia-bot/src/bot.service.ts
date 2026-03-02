import { keywordManager } from './engine/keywordManager';
import { taskEngine } from './engine/tasks/taskEngine';
import { gptAdapter } from './adapters/gpt.adapter';
import { governanceGuard } from './governance/governance.guard';
import BotAuditLog from './audit/models/auditLog.model';
import { logger } from '@config/logger';

export interface BotMessageInput {
    tenantId: string;
    userPhone: string;
    message: string;
    sessionId: string;
    botConfig: {
        name: string;
        tone: string;
        professionalName: string;
    };
}

export interface BotMessageResponse {
    response: string;
    action: string;
    taskExecuted?: string;
}

/**
 * Main Bot Pipeline:
 * WhatsApp → Keyword Manager → Governance Pre-Check → Task Engine / GPT → Governance Post-Check → Audit → User
 */
export class BotService {
    async processMessage(input: BotMessageInput): Promise<BotMessageResponse> {
        const startTime = Date.now();
        let response = '';
        let action = 'allowed';
        let taskExecuted: string | undefined;
        let keywordMatch = keywordManager.analyze(input.message);

        try {
            // Step 1: Keyword analysis
            logger.debug('Bot keyword analysis', {
                tenantId: input.tenantId,
                keywordMatch: keywordMatch?.level,
            });

            // Step 2: Governance pre-check
            const preCheck = governanceGuard.preCheck(input.message, keywordMatch?.level);
            if (preCheck.action === 'escalated' || preCheck.action === 'modified') {
                response = preCheck.message;
                action = preCheck.action;
            } else if (keywordMatch?.level === 'administrative') {
                // Step 3a: Administrative task — handle via Task Engine (no LLM)
                const taskResult = await taskEngine.execute(
                    keywordMatch.action, input.tenantId, input.userPhone, input.message
                );
                response = taskResult.response;
                taskExecuted = taskResult.taskName;
                action = 'task_executed';
            } else {
                // Step 3b: General message — send to LLM with governance prompt
                const systemPrompt = governanceGuard.buildSystemPrompt(
                    input.botConfig.name, input.botConfig.tone, input.botConfig.professionalName
                );
                const llmResponse = await gptAdapter.generateResponse(systemPrompt, input.message);
                response = llmResponse.content;

                // Step 4: Governance post-check on LLM response
                const postCheck = governanceGuard.postCheck(response);
                if (postCheck.action !== 'allowed') {
                    response = postCheck.message;
                    action = postCheck.action;
                    logger.warn('Governance post-check modified response', {
                        tenantId: input.tenantId,
                        reason: postCheck.reason,
                    });
                }
            }
        } catch (error: any) {
            logger.error('Bot processing error:', error);
            response = 'Disculpá, tuve un problema procesando tu mensaje. Por favor intentá de nuevo.';
            action = 'error';
        }

        const latencyMs = Date.now() - startTime;

        // Step 5: Audit — log everything
        await this.audit(input, response, action, taskExecuted, keywordMatch, latencyMs);

        return { response, action, taskExecuted };
    }

    private async audit(
        input: BotMessageInput,
        botResponse: string,
        action: string,
        taskExecuted: string | undefined,
        keywordMatch: any,
        latencyMs: number
    ): Promise<void> {
        try {
            // Log incoming message
            await BotAuditLog.create({
                tenantId: input.tenantId,
                sessionId: input.sessionId,
                userPhone: input.userPhone,
                messageDirection: 'incoming',
                messageContent: input.message,
                taskExecuted,
                botResponse,
                keywordMatch: keywordMatch || undefined,
                governanceAction: action,
                latencyMs,
            });
        } catch (error) {
            logger.error('Bot audit log error:', error);
        }
    }
}

export const botService = new BotService();
