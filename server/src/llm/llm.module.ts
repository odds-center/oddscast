import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LlmService } from './llm.service';
import { OpenAIService } from './providers/openai.service';

/**
 * LLM 모듈
 *
 * OpenAI GPT-4o 전용 (Claude 제거)
 */
@Module({
  imports: [ConfigModule],
  providers: [LlmService, OpenAIService],
  exports: [LlmService],
})
export class LlmModule {}
