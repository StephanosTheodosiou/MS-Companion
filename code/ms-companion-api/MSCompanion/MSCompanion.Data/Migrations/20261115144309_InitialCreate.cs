using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MSCompanion.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    password_hash = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    first_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    last_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    role = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_users", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "patient",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    preferred_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    date_of_birth = table.Column<DateOnly>(type: "date", nullable: true),
                    ms_type = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    diagnosis_year = table.Column<short>(type: "smallint", nullable: true),
                    ms_team_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    ms_team_phone = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    time_zone = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    server_updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_patient", x => x.id);
                    table.CheckConstraint("ck_patient_diagnosis_year", "diagnosis_year IS NULL OR diagnosis_year BETWEEN 1950 AND 2100");
                    table.ForeignKey(
                        name: "fk_patient_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "appointment",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    starts_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    type = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    clinician_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    location = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    server_updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_appointment", x => x.id);
                    table.ForeignKey(
                        name: "fk_appointment_patients_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patient",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "consent_record",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    data_type = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    granted = table.Column<bool>(type: "boolean", nullable: false),
                    policy_version = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    server_updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_consent_record", x => x.id);
                    table.ForeignKey(
                        name: "fk_consent_record_patients_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patient",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "medication",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    dose = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    instructions = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    is_disease_modifying = table.Column<bool>(type: "boolean", nullable: false),
                    status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    start_date = table.Column<DateOnly>(type: "date", nullable: true),
                    end_date = table.Column<DateOnly>(type: "date", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    server_updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_medication", x => x.id);
                    table.UniqueConstraint("ak_medication_id_patient_id", x => new { x.id, x.patient_id });
                    table.CheckConstraint("ck_medication_dates", "end_date IS NULL OR start_date IS NULL OR end_date >= start_date");
                    table.ForeignKey(
                        name: "fk_medication_patients_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patient",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "relapse_log_entry",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    symptom_description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    body_area = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    onset_date = table.Column<DateOnly>(type: "date", nullable: false),
                    lasted_over24hours = table.Column<bool>(type: "boolean", nullable: false),
                    had_fever = table.Column<bool>(type: "boolean", nullable: true),
                    heat_exposure = table.Column<bool>(type: "boolean", nullable: true),
                    guidance_shown = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    contacted_ms_team = table.Column<bool>(type: "boolean", nullable: false),
                    resolved_on = table.Column<DateOnly>(type: "date", nullable: true),
                    note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    server_updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_relapse_log_entry", x => x.id);
                    table.CheckConstraint("ck_relapse_log_entry_dates", "resolved_on IS NULL OR resolved_on >= onset_date");
                    table.ForeignKey(
                        name: "fk_relapse_log_entry_patient_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patient",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "symptom_checkin",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    checkin_date = table.Column<DateOnly>(type: "date", nullable: false),
                    fatigue = table.Column<short>(type: "smallint", nullable: false),
                    mobility = table.Column<short>(type: "smallint", nullable: false),
                    pain = table.Column<short>(type: "smallint", nullable: false),
                    mood = table.Column<short>(type: "smallint", nullable: false),
                    cognition = table.Column<short>(type: "smallint", nullable: false),
                    bladder = table.Column<short>(type: "smallint", nullable: false),
                    note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    low_mood_prompt_shown = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    server_updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
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

            migrationBuilder.CreateTable(
                name: "visit_question",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    appointment_id = table.Column<Guid>(type: "uuid", nullable: true),
                    text = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    asked = table.Column<bool>(type: "boolean", nullable: false),
                    answer_note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    server_updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_visit_question", x => x.id);
                    table.ForeignKey(
                        name: "fk_visit_question_appointment_appointment_id",
                        column: x => x.appointment_id,
                        principalTable: "appointment",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_visit_question_patient_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patient",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "visit_report",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    appointment_id = table.Column<Guid>(type: "uuid", nullable: true),
                    period_start = table.Column<DateOnly>(type: "date", nullable: false),
                    period_end = table.Column<DateOnly>(type: "date", nullable: false),
                    generated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    fhir_bundle_json = table.Column<string>(type: "jsonb", nullable: false),
                    fhir_version = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    server_updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_visit_report", x => x.id);
                    table.CheckConstraint("ck_visit_report_period", "period_end >= period_start");
                    table.ForeignKey(
                        name: "fk_visit_report_appointment_appointment_id",
                        column: x => x.appointment_id,
                        principalTable: "appointment",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_visit_report_patient_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patient",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "blood_test_reminder",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    test_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    medication_id = table.Column<Guid>(type: "uuid", nullable: true),
                    due_date = table.Column<DateOnly>(type: "date", nullable: false),
                    repeat_every_weeks = table.Column<short>(type: "smallint", nullable: true),
                    completed_on = table.Column<DateOnly>(type: "date", nullable: true),
                    reminder_enabled = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    server_updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_blood_test_reminder", x => x.id);
                    table.CheckConstraint("ck_blood_test_reminder_repeat", "repeat_every_weeks IS NULL OR repeat_every_weeks > 0");
                    table.ForeignKey(
                        name: "fk_blood_test_reminder_medications_medication_id",
                        column: x => x.medication_id,
                        principalTable: "medication",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_blood_test_reminder_patients_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patient",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "medication_schedule",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    medication_id = table.Column<Guid>(type: "uuid", nullable: false),
                    time_of_day = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    days = table.Column<int>(type: "integer", nullable: false),
                    reminder_enabled = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    server_updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_medication_schedule", x => x.id);
                    table.CheckConstraint("ck_medication_schedule_days", "days BETWEEN 1 AND 127");
                    table.ForeignKey(
                        name: "fk_medication_schedule_medication_medication_id_patient_id",
                        columns: x => new { x.medication_id, x.patient_id },
                        principalTable: "medication",
                        principalColumns: new[] { "id", "patient_id" },
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_medication_schedule_patients_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patient",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "side_effect",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    medication_id = table.Column<Guid>(type: "uuid", nullable: true),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    severity = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    started_on = table.Column<DateOnly>(type: "date", nullable: false),
                    ended_on = table.Column<DateOnly>(type: "date", nullable: true),
                    note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    server_updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_side_effect", x => x.id);
                    table.CheckConstraint("ck_side_effect_dates", "ended_on IS NULL OR ended_on >= started_on");
                    table.ForeignKey(
                        name: "fk_side_effect_medication_medication_id",
                        column: x => x.medication_id,
                        principalTable: "medication",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_side_effect_patient_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patient",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "medication_intake",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    medication_id = table.Column<Guid>(type: "uuid", nullable: false),
                    schedule_id = table.Column<Guid>(type: "uuid", nullable: true),
                    scheduled_for = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    taken_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    note = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    server_updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_medication_intake", x => x.id);
                    table.ForeignKey(
                        name: "fk_medication_intake_medication_medication_id_patient_id",
                        columns: x => new { x.medication_id, x.patient_id },
                        principalTable: "medication",
                        principalColumns: new[] { "id", "patient_id" },
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_medication_intake_medication_schedules_schedule_id",
                        column: x => x.schedule_id,
                        principalTable: "medication_schedule",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_medication_intake_patients_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patient",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_appointment_patient_id_server_updated_at",
                table: "appointment",
                columns: new[] { "patient_id", "server_updated_at" });

            migrationBuilder.CreateIndex(
                name: "ix_appointment_patient_id_starts_at",
                table: "appointment",
                columns: new[] { "patient_id", "starts_at" });

            migrationBuilder.CreateIndex(
                name: "ix_blood_test_reminder_medication_id",
                table: "blood_test_reminder",
                column: "medication_id");

            migrationBuilder.CreateIndex(
                name: "ix_blood_test_reminder_patient_id_due_date",
                table: "blood_test_reminder",
                columns: new[] { "patient_id", "due_date" });

            migrationBuilder.CreateIndex(
                name: "ix_blood_test_reminder_patient_id_server_updated_at",
                table: "blood_test_reminder",
                columns: new[] { "patient_id", "server_updated_at" });

            migrationBuilder.CreateIndex(
                name: "ix_consent_record_patient_id_data_type_created_at",
                table: "consent_record",
                columns: new[] { "patient_id", "data_type", "created_at" });

            migrationBuilder.CreateIndex(
                name: "ix_consent_record_patient_id_server_updated_at",
                table: "consent_record",
                columns: new[] { "patient_id", "server_updated_at" });

            migrationBuilder.CreateIndex(
                name: "ix_medication_patient_id_server_updated_at",
                table: "medication",
                columns: new[] { "patient_id", "server_updated_at" });

            migrationBuilder.CreateIndex(
                name: "ix_medication_intake_medication_id_patient_id",
                table: "medication_intake",
                columns: new[] { "medication_id", "patient_id" });

            migrationBuilder.CreateIndex(
                name: "ix_medication_intake_patient_id_medication_id_scheduled_for",
                table: "medication_intake",
                columns: new[] { "patient_id", "medication_id", "scheduled_for" });

            migrationBuilder.CreateIndex(
                name: "ix_medication_intake_patient_id_server_updated_at",
                table: "medication_intake",
                columns: new[] { "patient_id", "server_updated_at" });

            migrationBuilder.CreateIndex(
                name: "ix_medication_intake_schedule_id_scheduled_for",
                table: "medication_intake",
                columns: new[] { "schedule_id", "scheduled_for" },
                unique: true,
                filter: "deleted_at IS NULL AND schedule_id IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "ix_medication_schedule_medication_id_patient_id",
                table: "medication_schedule",
                columns: new[] { "medication_id", "patient_id" });

            migrationBuilder.CreateIndex(
                name: "ix_medication_schedule_patient_id_server_updated_at",
                table: "medication_schedule",
                columns: new[] { "patient_id", "server_updated_at" });

            migrationBuilder.CreateIndex(
                name: "ix_patient_user_id",
                table: "patient",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_relapse_log_entry_patient_id_onset_date",
                table: "relapse_log_entry",
                columns: new[] { "patient_id", "onset_date" });

            migrationBuilder.CreateIndex(
                name: "ix_relapse_log_entry_patient_id_server_updated_at",
                table: "relapse_log_entry",
                columns: new[] { "patient_id", "server_updated_at" });

            migrationBuilder.CreateIndex(
                name: "ix_side_effect_medication_id",
                table: "side_effect",
                column: "medication_id");

            migrationBuilder.CreateIndex(
                name: "ix_side_effect_patient_id_server_updated_at",
                table: "side_effect",
                columns: new[] { "patient_id", "server_updated_at" });

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

            migrationBuilder.CreateIndex(
                name: "ix_users_email",
                table: "users",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_visit_question_appointment_id",
                table: "visit_question",
                column: "appointment_id");

            migrationBuilder.CreateIndex(
                name: "ix_visit_question_patient_id_server_updated_at",
                table: "visit_question",
                columns: new[] { "patient_id", "server_updated_at" });

            migrationBuilder.CreateIndex(
                name: "ix_visit_report_appointment_id",
                table: "visit_report",
                column: "appointment_id");

            migrationBuilder.CreateIndex(
                name: "ix_visit_report_patient_id_generated_at",
                table: "visit_report",
                columns: new[] { "patient_id", "generated_at" });

            migrationBuilder.CreateIndex(
                name: "ix_visit_report_patient_id_server_updated_at",
                table: "visit_report",
                columns: new[] { "patient_id", "server_updated_at" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "blood_test_reminder");

            migrationBuilder.DropTable(
                name: "consent_record");

            migrationBuilder.DropTable(
                name: "medication_intake");

            migrationBuilder.DropTable(
                name: "relapse_log_entry");

            migrationBuilder.DropTable(
                name: "side_effect");

            migrationBuilder.DropTable(
                name: "symptom_checkin");

            migrationBuilder.DropTable(
                name: "visit_question");

            migrationBuilder.DropTable(
                name: "visit_report");

            migrationBuilder.DropTable(
                name: "medication_schedule");

            migrationBuilder.DropTable(
                name: "appointment");

            migrationBuilder.DropTable(
                name: "medication");

            migrationBuilder.DropTable(
                name: "patient");

            migrationBuilder.DropTable(
                name: "users");
        }
    }
}
