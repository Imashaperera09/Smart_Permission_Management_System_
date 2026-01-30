using System;
using System.Text.Json.Serialization;
using Postgrest.Attributes;
using Postgrest.Models;

namespace SmartLeave.Api.Models
{
    [Table("Roles")]
    public class Role : BaseModel
    {
        [PrimaryKey("id", false)]
        public Guid Id { get; set; }

        [Column("name")]
        public string Name { get; set; } = string.Empty;
    }

    [Table("Profiles")]
    public class UserProfile : BaseModel
    {
        [PrimaryKey("id", false)]
        public Guid Id { get; set; }

        [Column("full_name")]
        public string? FullName { get; set; }

        [Column("leave_balance")]
        public int LeaveBalance { get; set; }

        [Column("role_id")]
        public Guid? RoleId { get; set; }
    }

    [Table("LeaveTypes")]
    public class LeaveType : BaseModel
    {
        [PrimaryKey("id", false)]
        public Guid Id { get; set; }

        [Column("name")]
        public string Name { get; set; } = string.Empty;

        [Column("max_days")]
        public int MaxDays { get; set; }
    }

    [Table("LeaveRequests")]
    public class LeaveRequest : BaseModel
    {
        [PrimaryKey("id", false)]
        public Guid Id { get; set; }

        [Column("user_id")]
        public Guid UserId { get; set; }

        [Column("leave_type_id")]
        public Guid LeaveTypeId { get; set; }

        [Column("start_date")]
        public DateTime StartDate { get; set; }

        [Column("end_date")]
        public DateTime EndDate { get; set; }

        [Column("reason")]
        public string? Reason { get; set; }

        [Column("status")]
        public string Status { get; set; } = "Pending";

        [Column("medical_url")]
        public string? MedicalUrl { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }
    }
}
