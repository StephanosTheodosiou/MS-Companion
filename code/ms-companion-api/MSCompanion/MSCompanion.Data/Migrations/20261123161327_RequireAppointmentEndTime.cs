using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MSCompanion.Data.Migrations
{
    /// <inheritdoc />
    public partial class RequireAppointmentEndTime : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "UPDATE appointment SET ends_at = starts_at + interval '30 minutes' " +
                "WHERE ends_at IS NULL AND status <> 'Cancelled';");

            migrationBuilder.AddCheckConstraint(
                name: "ck_appointment_end_required",
                table: "appointment",
                sql: "status = 'Cancelled' OR ends_at IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_appointment_end_required",
                table: "appointment");
        }
    }
}
