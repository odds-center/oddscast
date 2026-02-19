import { axiosInstance, handleApiResponse } from './axios';

export interface GlobalConfig {
  show_google_login?: string;
  [key: string]: string | undefined;
}

export default class ConfigApi {
  static async getConfig(): Promise<GlobalConfig> {
    const response = await axiosInstance.get('/config');
    return handleApiResponse(response) ?? {};
  }

  static async getShowGoogleLogin(): Promise<boolean> {
    const config = await this.getConfig();
    const val = config.show_google_login;
    if (val === undefined || val === null || val === '') return true; // 설정 없으면 표시
    if (val === 'false' || val === '0' || val === 'no') return false;
    return val === 'true' || val === '1' || val === 'yes';
  }
}
