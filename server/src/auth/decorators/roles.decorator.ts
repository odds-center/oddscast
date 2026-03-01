import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../database/db-enums';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
