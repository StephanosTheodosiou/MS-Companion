using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MSCompanion.Data.Migrations
{
    /// <inheritdoc />
    public partial class CheckInScaleZeroToFour : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_check_in_answer_score",
                table: "check_in_answer");

            migrationBuilder.Sql("UPDATE check_in_answer SET score = round(score * 0.4);");
            migrationBuilder.Sql("UPDATE check_in SET server_updated_at = now() WHERE id IN (SELECT check_in_id FROM check_in_answer);");

            migrationBuilder.AddCheckConstraint(
                name: "ck_check_in_answer_score",
                table: "check_in_answer",
                sql: "score BETWEEN 0 AND 4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_check_in_answer_score",
                table: "check_in_answer");

            migrationBuilder.Sql("UPDATE check_in_answer SET score = round(score * 2.5);");
            migrationBuilder.Sql("UPDATE check_in SET server_updated_at = now() WHERE id IN (SELECT check_in_id FROM check_in_answer);");

            migrationBuilder.AddCheckConstraint(
                name: "ck_check_in_answer_score",
                table: "check_in_answer",
                sql: "score BETWEEN 0 AND 10");
        }
    }
}
