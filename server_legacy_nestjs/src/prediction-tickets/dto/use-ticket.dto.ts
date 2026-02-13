import { IsString } from 'class-validator';

/**
 * 예측권 사용 DTO
 */
export class UseTicketDto {
  @IsString()
  raceId: string;
}
