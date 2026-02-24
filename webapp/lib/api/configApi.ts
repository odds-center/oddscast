import { axiosInstance, handleApiResponse } from './axios';

export interface GlobalConfig {
  [key: string]: string | undefined;
}

export default class ConfigApi {
  static async getConfig(): Promise<GlobalConfig> {
    const response = await axiosInstance.get('/config');
    return handleApiResponse(response) ?? {};
  }
}
