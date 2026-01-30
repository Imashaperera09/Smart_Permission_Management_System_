using System;
using System.Linq;
using System.Threading.Tasks;
using SmartLeave.Api.Models;
using Supabase;

namespace SmartLeave.Api.Services
{
    public interface ILeaveRuleService
    {
        Task<(bool IsValid, string Message)> ValidateLeaveRequest(LeaveRequest request);
    }

    public class LeaveRuleService : ILeaveRuleService
    {
        private readonly Supabase.Client _supabaseClient;

        public LeaveRuleService(Supabase.Client supabaseClient)
        {
            _supabaseClient = supabaseClient;
        }

        public async Task<(bool IsValid, string Message)> ValidateLeaveRequest(LeaveRequest request)
        {
            // 1. Check if start date is before end date
            if (request.StartDate > request.EndDate)
            {
                return (false, "Start date cannot be after end date.");
            }

            // 2. Check for overlapping dates
            var overlappingRequests = await _supabaseClient.From<LeaveRequest>()
                .Where(x => x.UserId == request.UserId)
                .Where(x => x.Status != "Rejected" && x.Status != "Cancelled")
                .Get();

            bool hasOverlap = overlappingRequests.Models.Any(existing =>
                (request.StartDate <= existing.EndDate && request.EndDate >= existing.StartDate)
            );

            if (hasOverlap)
            {
                return (false, "You already have a leave request during this period.");
            }

            // 3. Check leave balance
            var profileResponse = await _supabaseClient.From<UserProfile>().Where(x => x.Id == request.UserId).Get();
            var profile = profileResponse.Models.FirstOrDefault();

            if (profile == null)
            {
                return (false, "User profile not found.");
            }

            int requestedDays = (request.EndDate - request.StartDate).Days + 1;
            if (profile.LeaveBalance < requestedDays)
            {
                return (false, $"Insufficient leave balance. Requested: {requestedDays}, Available: {profile.LeaveBalance}");
            }

            return (true, "Valid");
        }
    }
}
