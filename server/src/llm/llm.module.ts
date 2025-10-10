import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LlmService } from './llm.service';
import { OpenAIService } from './providers/openai.service';
import { ClaudeService } from './providers/claude.service';

/**
 * LLM 모듈
 *
 * OpenAI GPT-4o 및 Claude 3.5 Sonnet 통합
 */
@Module({
  imports: [ConfigModule],
  providers: [LlmService, OpenAIService, ClaudeService],
  exports: [LlmService],
})
export class LlmModule {}
