using Microsoft.AspNetCore.Mvc;
using SmartLeave.Api.Models;
using SmartLeave.Api.Services;
using Supabase;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SmartLeave.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LeaveRequestController : ControllerBase
    {
        private readonly Supabase.Client _supabaseClient;
        private readonly ILeaveRuleService _leaveRuleService;

        public LeaveRequestController(Supabase.Client supabaseClient, ILeaveRuleService leaveRuleService)
        {
            _supabaseClient = supabaseClient;
            _leaveRuleService = leaveRuleService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<LeaveRequest>>> GetLeaveRequests()
        {
            var response = await _supabaseClient.From<LeaveRequest>().Get();
            return Ok(response.Models);
        }

        [HttpPost]
        public async Task<ActionResult<LeaveRequest>> CreateLeaveRequest(LeaveRequest request)
        {
            var validation = await _leaveRuleService.ValidateLeaveRequest(request);
            if (!validation.IsValid)
            {
                return BadRequest(validation.Message);
            }

            var response = await _supabaseClient.From<LeaveRequest>().Insert(request);
            var newRequest = response.Models.FirstOrDefault();
            
            if (newRequest == null) return BadRequest("Failed to create request");

            // Return a clean object to avoid JSON serialization errors with Supabase attributes
            return Ok(new { 
                newRequest.Id, 
                newRequest.UserId, 
                newRequest.LeaveTypeId, 
                newRequest.StartDate, 
                newRequest.EndDate, 
                newRequest.Status 
            });
        }

        [HttpGet("all")]
        public async Task<ActionResult<IEnumerable<LeaveRequest>>> GetAllLeaveRequests()
        {
            var response = await _supabaseClient.From<LeaveRequest>().Get();
            return Ok(response.Models);
        }

        [HttpPost("approve/{id}")]
        public async Task<ActionResult> ApproveRequest(Guid id)
        {
            var response = await _supabaseClient.From<LeaveRequest>()
                .Where(x => x.Id == id)
                .Set(x => x.Status, "Approved")
                .Update();

            if (response.Models.Count == 0) return NotFound();
            return Ok();
        }

        [HttpPost("reject/{id}")]
        public async Task<ActionResult> RejectRequest(Guid id)
        {
            var response = await _supabaseClient.From<LeaveRequest>()
                .Where(x => x.Id == id)
                .Set(x => x.Status, "Rejected")
                .Update();

            if (response.Models.Count == 0) return NotFound();
            return Ok();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<LeaveRequest>> GetLeaveRequest(Guid id)
        {
            var response = await _supabaseClient.From<LeaveRequest>().Where(x => x.Id == id).Get();
            var request = response.Models.FirstOrDefault();

            if (request == null) return NotFound();

            return Ok(request);
        }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class ProfileController : ControllerBase
    {
        private readonly Supabase.Client _supabaseClient;

        public ProfileController(Supabase.Client supabaseClient)
        {
            _supabaseClient = supabaseClient;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<UserProfile>> GetProfile(Guid id)
        {
            var response = await _supabaseClient.From<UserProfile>().Where(x => x.Id == id).Get();
            var profile = response.Models.FirstOrDefault();

            if (profile == null) return NotFound();

            return Ok(profile);
        }

        [HttpGet("roles")]
        public async Task<ActionResult<IEnumerable<Role>>> GetRoles()
        {
            var response = await _supabaseClient.From<Role>().Get();
            return Ok(response.Models);
        }
    }
}
