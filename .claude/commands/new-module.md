Create a new NestJS module named "$ARGUMENTS" following OddsCast server conventions.

## Steps

1. Create `server/src/$ARGUMENTS/` directory with:
   - `$ARGUMENTS.module.ts` — @Module({ imports, controllers, providers, exports })
   - `$ARGUMENTS.controller.ts` — REST endpoints with Swagger decorators
   - `$ARGUMENTS.service.ts` — @Injectable, constructor DI, business logic
   - `dto/create-$ARGUMENTS.dto.ts` — class-validator + @ApiProperty

2. Register in `server/src/app.module.ts` imports array

3. Apply mandatory patterns:
   - All routes: /api prefix is global (set in main.ts)
   - Protected routes: @UseGuards(JwtAuthGuard)
   - Admin routes: @UseGuards(JwtAuthGuard, RolesGuard) + @Roles(UserRole.ADMIN)
   - Errors: throw NestJS built-ins (BadRequestException, NotFoundException, etc.)
   - No `any` types — use `unknown` + type guards or concrete types
   - Swagger: @ApiTags, @ApiOperation, @ApiBearerAuth on every endpoint
   - Response format: ResponseInterceptor auto-wraps { data, status, message }

4. If a new DB entity is needed:
   - Create entity in `server/src/database/entities/$ARGUMENTS.entity.ts`
   - Add to `server/src/database/data-source.ts`
   - Update `docs/db/schema.sql` + `docs/architecture/DATABASE_SCHEMA.md`

5. After creation, update `docs/TODO_CONTINUE.md` status if this was a planned task.

Reference: .claude/rules/server.md
