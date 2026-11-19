using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814

namespace MSCompanion.Data.Migrations
{
    public partial class AddCheckInsAndFunctionTests : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "symptom_checkin");

            migrationBuilder.CreateTable(
                name: "check_in",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    local_date = table.Column<DateOnly>(type: "date", nullable: false),
                    time_zone = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    questionnaire_version = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    server_updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_check_in", x => x.id);
                    table.ForeignKey(
                        name: "fk_check_in_patients_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patient",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "test_metric",
                columns: table => new
                {
                    code = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    test_type = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    display = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    unit = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_test_metric", x => x.code);
                    table.UniqueConstraint("ak_test_metric_code_test_type", x => new { x.code, x.test_type });
                    table.CheckConstraint("ck_test_metric_test_type", "test_type IN ('SymbolDigit', 'FingerTapping', 'Walking')");
                });

            migrationBuilder.CreateTable(
                name: "test_session",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    test_type = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    is_practice = table.Column<bool>(type: "boolean", nullable: false),
                    started_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ended_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    time_zone = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    app_version = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    device_model = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    server_updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_test_session", x => x.id);
                    table.UniqueConstraint("ak_test_sessions_id_test_type", x => new { x.id, x.test_type });
                    table.CheckConstraint("ck_test_session_status", "status IN ('Completed', 'Aborted')");
                    table.CheckConstraint("ck_test_session_test_type", "test_type IN ('SymbolDigit', 'FingerTapping', 'Walking')");
                    table.CheckConstraint("ck_test_session_times", "ended_at >= started_at");
                    table.ForeignKey(
                        name: "fk_test_session_patient_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patient",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "check_in_answer",
                columns: table => new
                {
                    check_in_id = table.Column<Guid>(type: "uuid", nullable: false),
                    item = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    score = table.Column<short>(type: "smallint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_check_in_answer", x => new { x.check_in_id, x.item });
                    table.CheckConstraint("ck_check_in_answer_item", "item IN ('Fatigue', 'Mobility', 'Mood')");
                    table.CheckConstraint("ck_check_in_answer_score", "score BETWEEN 0 AND 10");
                    table.ForeignKey(
                        name: "fk_check_in_answer_check_ins_check_in_id",
                        column: x => x.check_in_id,
                        principalTable: "check_in",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "test_raw_data",
                columns: table => new
                {
                    session_id = table.Column<Guid>(type: "uuid", nullable: false),
                    format_version = table.Column<short>(type: "smallint", nullable: false),
                    payload = table.Column<string>(type: "jsonb", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_test_raw_data", x => x.session_id);
                    table.CheckConstraint("ck_test_raw_data_format_version", "format_version > 0");
                    table.ForeignKey(
                        name: "fk_test_raw_data_test_sessions_session_id",
                        column: x => x.session_id,
                        principalTable: "test_session",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "test_result",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    session_id = table.Column<Guid>(type: "uuid", nullable: false),
                    test_type = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    metric_code = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    laterality = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    value = table.Column<decimal>(type: "numeric", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_test_result", x => x.id);
                    table.CheckConstraint("ck_test_result_laterality", "laterality IN ('Left', 'Right')");
                    table.CheckConstraint("ck_test_result_laterality_required", "(test_type = 'FingerTapping') = (laterality IS NOT NULL)");
                    table.CheckConstraint("ck_test_result_test_type", "test_type IN ('SymbolDigit', 'FingerTapping', 'Walking')");
                    table.CheckConstraint("ck_test_result_value", "value >= 0");
                    table.ForeignKey(
                        name: "fk_test_result_test_metric_metric_code_test_type",
                        columns: x => new { x.metric_code, x.test_type },
                        principalTable: "test_metric",
                        principalColumns: new[] { "code", "test_type" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_test_result_test_sessions_session_id_test_type",
                        columns: x => new { x.session_id, x.test_type },
                        principalTable: "test_session",
                        principalColumns: new[] { "id", "test_type" },
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "test_metric",
                columns: new[] { "code", "display", "test_type", "unit" },
                values: new object[,]
                {
                    { "finger-tapping-intertap-cv", "Finger tapping: inter-tap interval coefficient of variation", "FingerTapping", "%" },
                    { "finger-tapping-intertap-mean", "Finger tapping: mean inter-tap interval", "FingerTapping", "ms" },
                    { "finger-tapping-tap-count", "Finger tapping: number of taps", "FingerTapping", "{taps}" },
                    { "finger-tapping-tap-rate", "Finger tapping: tap rate", "FingerTapping", "{taps}/s" },
                    { "symbol-digit-accuracy", "Symbol-digit test: accuracy", "SymbolDigit", "%" },
                    { "symbol-digit-correct-count", "Symbol-digit test: correct responses", "SymbolDigit", "{count}" },
                    { "symbol-digit-error-count", "Symbol-digit test: errors", "SymbolDigit", "{count}" },
                    { "symbol-digit-mean-response-time", "Symbol-digit test: mean response time", "SymbolDigit", "ms" },
                    { "walking-cadence", "Walking test: cadence", "Walking", "{steps}/min" },
                    { "walking-duration", "Walking test: duration", "Walking", "s" },
                    { "walking-step-count", "Walking test: step count", "Walking", "{steps}" },
                    { "walking-step-time-cv", "Walking test: step time coefficient of variation", "Walking", "%" }
                });

            migrationBuilder.CreateIndex(
                name: "ix_check_in_patient_id_local_date",
                table: "check_in",
                columns: new[] { "patient_id", "local_date" },
                unique: true,
                filter: "deleted_at IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_check_in_patient_id_server_updated_at",
                table: "check_in",
                columns: new[] { "patient_id", "server_updated_at" });

            migrationBuilder.CreateIndex(
                name: "ix_test_result_metric_code_test_type",
                table: "test_result",
                columns: new[] { "metric_code", "test_type" });

            migrationBuilder.CreateIndex(
                name: "ix_test_result_session_id_metric_code_laterality",
                table: "test_result",
                columns: new[] { "session_id", "metric_code", "laterality" },
                unique: true)
                .Annotation("Npgsql:NullsDistinct", false);

            migrationBuilder.CreateIndex(
                name: "ix_test_result_session_id_test_type",
                table: "test_result",
                columns: new[] { "session_id", "test_type" });

            migrationBuilder.CreateIndex(
                name: "ix_test_session_patient_id_server_updated_at",
                table: "test_session",
                columns: new[] { "patient_id", "server_updated_at" });

            migrationBuilder.CreateIndex(
                name: "ix_test_session_trend",
                table: "test_session",
                columns: new[] { "patient_id", "test_type", "started_at" },
                filter: "status = 'Completed' AND NOT is_practice AND deleted_at IS NULL");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "check_in_answer");

            migrationBuilder.DropTable(
                name: "test_raw_data");

            migrationBuilder.DropTable(
                name: "test_result");

            migrationBuilder.DropTable(
                name: "check_in");

            migrationBuilder.DropTable(
                name: "test_metric");

            migrationBuilder.DropTable(
                name: "test_session");

            migrationBuilder.CreateTable(
                name: "symptom_checkin",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    bladder = table.Column<short>(type: "smallint", nullable: false),
                    checkin_date = table.Column<DateOnly>(type: "date", nullable: false),
                    cognition = table.Column<short>(type: "smallint", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    fatigue = table.Column<short>(type: "smallint", nullable: false),
                    low_mood_prompt_shown = table.Column<bool>(type: "boolean", nullable: false),
                    mobility = table.Column<short>(type: "smallint", nullable: false),
                    mood = table.Column<short>(type: "smallint", nullable: false),
                    note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    pain = table.Column<short>(type: "smallint", nullable: false),
                    server_updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_symptom_checkin", x => x.id);
                    table.CheckConstraint("ck_symptom_checkin_bladder", "bladder BETWEEN 0 AND 4");
                    table.CheckConstraint("ck_symptom_checkin_cognition", "cognition BETWEEN 0 AND 4");
                    table.CheckConstraint("ck_symptom_checkin_fatigue", "fatigue BETWEEN 0 AND 4");
                    table.CheckConstraint("ck_symptom_checkin_mobility", "mobility BETWEEN 0 AND 4");
                    table.CheckConstraint("ck_symptom_checkin_mood", "mood BETWEEN 0 AND 4");
                    table.CheckConstraint("ck_symptom_checkin_pain", "pain BETWEEN 0 AND 4");
                    table.ForeignKey(
                        name: "fk_symptom_checkin_patient_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patient",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_symptom_checkin_patient_id_checkin_date",
                table: "symptom_checkin",
                columns: new[] { "patient_id", "checkin_date" },
                unique: true,
                filter: "deleted_at IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_symptom_checkin_patient_id_server_updated_at",
                table: "symptom_checkin",
                columns: new[] { "patient_id", "server_updated_at" });
        }
    }
}
