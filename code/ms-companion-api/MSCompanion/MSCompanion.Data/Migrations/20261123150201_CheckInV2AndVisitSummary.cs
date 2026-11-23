using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MSCompanion.Data.Migrations
{
    /// <inheritdoc />
    public partial class CheckInV2AndVisitSummary : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_check_in_answer_item",
                table: "check_in_answer");

            migrationBuilder.AlterColumn<string>(
                name: "fhir_bundle_json",
                table: "visit_report",
                type: "jsonb",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "jsonb");

            migrationBuilder.AddColumn<string>(
                name: "summary_json",
                table: "visit_report",
                type: "jsonb",
                nullable: false);

            migrationBuilder.AddCheckConstraint(
                name: "ck_check_in_answer_item",
                table: "check_in_answer",
                sql: "item IN ('Fatigue', 'Mobility', 'Mood', 'Pain', 'Cognition', 'Bladder')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_check_in_answer_item",
                table: "check_in_answer");

            migrationBuilder.DropColumn(
                name: "summary_json",
                table: "visit_report");

            migrationBuilder.AlterColumn<string>(
                name: "fhir_bundle_json",
                table: "visit_report",
                type: "jsonb",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "jsonb",
                oldNullable: true);

            migrationBuilder.AddCheckConstraint(
                name: "ck_check_in_answer_item",
                table: "check_in_answer",
                sql: "item IN ('Fatigue', 'Mobility', 'Mood')");
        }
    }
}
