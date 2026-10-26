# PostgreSQL Migration Audit

## Scope and Safety Boundaries

This report records the repository state before PostgreSQL implementation work. No production database, production data, or external database was accessed during this audit. Existing MySQL Flyway migrations are retained unchanged because repository history cannot establish where they have already been applied.

## Application Architecture

| Area | Finding |
| --- | --- |
| Backend | Java 21, Spring Boot 3.5.11, Spring Data JPA/Hibernate, Spring Security, WebSocket, Maven |
| Frontend | React, TypeScript, Vite, MUI; no direct database access found |
| Persistence | Hibernate entities and Spring Data repositories, primarily derived queries and JPQL |
| Schema and seeds | Flyway `V1__Initial_Schema.sql`, `V2__Seed_Data.sql`, and `V3__Seed_Our_Part_Data.sql` |
| Local bootstrap | `start-springer.bat` checks a Windows MySQL service and calls the MySQL CLI |
| Tests | Maven/Surefire with H2 in MySQL compatibility mode; Flyway is disabled for tests |

The main business workflows are recruitment, hiring demand approval, drive scheduling, candidate evaluation, document processing, offers, academy training, attendance, scoring, leave management, intern self-service, and role-based administration. The existing browser test report identifies these as regression-critical workflows.

## Database Initialization Flow

1. `application.properties` activates the `dev` profile and configures Flyway at `classpath:db/migration`.
2. `application-dev.properties` imports the ignored `application-local.properties` and enables Flyway, while Hibernate runs with `ddl-auto=update`.
3. `application-prod.properties` also imports local configuration, enables Flyway, and validates Hibernate mappings.
4. `start-springer.bat` checks the configured MySQL Windows service, tests the database port, and invokes `mysql ... CREATE DATABASE IF NOT EXISTS` before starting Spring Boot.
5. Test profiles use H2 in `MODE=MySQL`, disable Flyway, and let Hibernate create/drop schema.

This means fresh runtime schema creation is intended to be Flyway-owned, but development configuration can also mutate schema through Hibernate. PostgreSQL configuration must use `ddl-auto=validate` after the PostgreSQL migrations are introduced.

## Relevant File Inventory

| File or area | Purpose | Migration impact |
| --- | --- | --- |
| `springer/pom.xml` | Maven dependencies | Replace MySQL JDBC/Flyway module with PostgreSQL equivalents |
| `springer/src/main/resources/application.properties` | Shared database, JPA, Flyway settings | MySQL driver/dialect and migration location |
| `springer/src/main/resources/application-dev.properties` | Development profile | MySQL dialect and unsafe `ddl-auto=update` |
| `springer/src/main/resources/application-prod.properties` | Production profile | MySQL driver/dialect |
| `springer/src/main/resources/application-local.properties` | Ignored local connection settings | Contains a MySQL JDBC URL; never copy credentials to tracked files |
| `springer/src/main/resources/application-test.properties` | Main test profile | H2 MySQL mode, Flyway disabled |
| `springer/src/test/resources/application-test.properties` | Test-resource profile | Duplicate H2 MySQL-mode configuration |
| `springer/src/main/resources/db/migration/V1__Initial_Schema.sql` | Shared MySQL schema migration | Preserve unchanged; PostgreSQL equivalent required |
| `springer/src/main/resources/db/migration/V2__Seed_Data.sql` | Shared MySQL master-data seed | Preserve unchanged; PostgreSQL equivalent required |
| `springer/src/main/resources/db/migration/V3__Seed_Our_Part_Data.sql` | Shared MySQL workflow/demo seed | Preserve unchanged; PostgreSQL equivalent required |
| `springer/db/mysql/*.sql` | Manual MySQL alterations and seed scripts | Preserve as historical/manual MySQL artifacts; do not treat as Flyway migrations |
| `springer/src/main/java/com/kanini/springer/repository/Academy/LeaveRequestRepository.java` | Leave-duration query | JPQL uses MySQL-specific `DATEDIFF` |
| `springer/src/main/java/com/kanini/springer/entity/**` | Entity mappings | Uses `GenerationType.IDENTITY`, string enums, and `TEXT` columns |
| `config.bat`, `start-springer.bat`, `README.md` | Local setup and startup | MySQL naming, service, CLI, and setup instructions |
| `TESTING_REPORT.md` | Existing browser regression evidence | Preserve as pre-migration behavioral baseline |

No Dockerfile, Docker Compose file, GitHub Actions workflow, or other CI/CD configuration was found in the tracked repository.

## Dependencies and Flyway History

`springer/pom.xml` declares `mysql-connector-j`, `flyway-core`, and `flyway-mysql`. Spring Boot manages Flyway's version through its 3.5.11 dependency management.

The three existing versioned migrations were added in the repository commit dated 2026-05-14. The repository does not contain Flyway schema-history exports, environment records, release tags, deployment manifests, or database access. It is therefore unknown whether `V1` through `V3` have been applied in development, staging, or production. Their names, versions, contents, and checksums must remain unchanged.

## MySQL-Specific Compatibility Findings

| Finding | Original behavior | PostgreSQL resolution | Verification |
| --- | --- | --- | --- |
| MySQL JDBC driver and URL | MySQL-specific driver, URL flags, and database creation option | PostgreSQL driver and `jdbc:postgresql` URL supplied by environment | PostgreSQL context startup |
| Hibernate MySQL dialect | MySQL DDL and SQL rendering | PostgreSQL dialect/automatic dialect resolution | Hibernate validation on PostgreSQL |
| `AUTO_INCREMENT` | Generated numeric keys | `GENERATED BY DEFAULT AS IDENTITY` | CRUD identifier integration test |
| Backtick identifiers | MySQL quoted identifiers | Unquoted lowercase PostgreSQL identifiers | Fresh migration test |
| `ENGINE=InnoDB` | MySQL storage engine | Omit; PostgreSQL uses its native storage engine | Fresh migration test |
| Inline `ENUM` | MySQL enum columns | `VARCHAR` with `CHECK` constraints to preserve allowed values | Schema validation and seed test |
| `TINYINT` booleans | Numeric boolean representation | PostgreSQL `BOOLEAN` | CRUD/constraint test |
| MySQL JSON type | JSON payload storage | `JSONB` | Fresh migration and seed test |
| `SET @variable` | Session variables in seed scripts | Common table expressions or subqueries | Seed-data migration test |
| `INSERT IGNORE` | Idempotent inserts | `INSERT ... ON CONFLICT DO NOTHING` with suitable uniqueness constraints | Second migration startup test |
| `NOW()` and `LIMIT` | MySQL expressions | PostgreSQL `CURRENT_TIMESTAMP` and compatible `LIMIT` or CTE rewrite | Seed-data migration test |
| JPQL `DATEDIFF` | Counts inclusive leave days | Portable date subtraction in the service layer | Leave-duration regression test |

`GenerationType.IDENTITY`, string enum mappings, and `TEXT` columns are supported by PostgreSQL/Hibernate and require validation rather than a source-level redesign.

## Baseline Results

| Check | Result | Notes |
| --- | --- | --- |
| Working tree before changes | Pass | Clean before this report was added |
| `springer\mvnw.cmd test` | Failed | Initial read-only baseline reported 515 tests, 1 failure, 1 error, 0 skipped, exit code 1. One observed failure message was `Leave start date cannot be in the past`. These failures predate PostgreSQL changes. |
| Second baseline confirmation | Blocked | The same Maven command exceeded the 120-second execution window. Its completion/result must be collected separately and must not be interpreted as a migration result. |
| Browser workflow evidence | Historical only | `TESTING_REPORT.md` reports 35+ pages tested with MySQL data; it is not PostgreSQL verification. |

## PostgreSQL Migration Strategy

The application is changing database vendor. Existing MySQL migrations remain at `classpath:db/migration` unchanged. PostgreSQL will receive an independent migration lineage at `classpath:db/postgresql/migration` containing PostgreSQL-specific `V1` through `V3` equivalents. PostgreSQL configuration will point Flyway only at that location.

### Fresh PostgreSQL Databases

1. Provision an empty PostgreSQL database and least-privilege application role outside the application.
2. Set PostgreSQL connection values through environment variables or an ignored local configuration file.
3. Start the application with the PostgreSQL profile.
4. Flyway applies PostgreSQL `V1` through `V3` to an empty database.
5. Hibernate validates mappings; it must not create or update schema.
6. Confirm Flyway schema history, schema objects, seed data, and a second startup with no reapplication of versioned migrations.

### Existing or Unknown-History Databases

No baseline, repair, or migration-history adoption command is included in this change. A database with unknown Flyway history must not be pointed at the new PostgreSQL migration location. Adoption requires a separately approved, non-production rehearsal that compares the existing schema, data, and migration history against the PostgreSQL lineage. A production MySQL-to-PostgreSQL data transfer is outside this code migration and requires backups, reconciliation, cutover approval, and a rollback decision point.

## Implementation Plan

1. Add PostgreSQL dependencies and isolated configuration without modifying MySQL migrations.
2. Add the PostgreSQL `V1` schema migration and validate it against a clean PostgreSQL instance.
3. Add PostgreSQL seed migrations derived from `V2` and `V3`; validate seed counts and repeat startup behavior.
4. Replace the `DATEDIFF` query with a portable implementation and add a focused regression test.
5. Add PostgreSQL integration tests using an isolated Testcontainers database when Docker is available.
6. Update startup scripts and documentation for PostgreSQL, then rerun the baseline and PostgreSQL-specific checks.

## Verified Local PostgreSQL Results

An isolated PostgreSQL 18 database, `springer_postgresql_migration_test`, was used for this verification. No production database or data was accessed.

| Check | Result | Notes |
| --- | --- | --- |
| PostgreSQL Flyway schema migration | Pass | PostgreSQL-specific `V1__Initial_Schema.sql` completed successfully. |
| PostgreSQL seed migrations | Pass | PostgreSQL-specific `V2__Seed_Data.sql` and `V3__Seed_Our_Part_Data.sql` completed successfully. |
| Flyway history | Pass | Versions 1, 2, and 3 are recorded as successful in `flyway_schema_history`. |
| Application startup | Pass | The opt-in `dev,postgresql` profile connected to the isolated database and started Tomcat on port 8080. |
| Hibernate schema mode | Pass | The PostgreSQL profile overrides inherited development `ddl-auto=update` with `ddl-auto=validate`, so Flyway remains the schema owner. |
| Binary LOB mapping | Pass | Four `@Lob byte[]` mappings were changed to `@JdbcTypeCode(SqlTypes.LONGVARBINARY)`, which aligns Hibernate with PostgreSQL `bytea` rather than `oid`. The subsequent PostgreSQL startup completed without the prior `file_data` to `oid` DDL error. |
| Maven compile | Pass | `mvnw.cmd -DskipTests compile` completed successfully after the PostgreSQL profile and binary mapping changes. |

The PostgreSQL migration path is intentionally opt-in through `application-postgresql.properties`. The default MySQL configuration and its original Flyway migrations remain unchanged.

## Risks and Required Confirmation

- Flyway deployment history and production schema state are unavailable in the repository.
- PostgreSQL Testcontainers verification depends on Docker being installed and running locally.
- No production data migration, performance benchmark, permission validation, or rollback drill can be claimed until a separately provisioned non-production environment is available.
- `application-local.properties` and `config.bat` are local configuration surfaces. Credentials must remain untracked and must not be copied into source control.