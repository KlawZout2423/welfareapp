$base = "http://localhost:3000/api/portal"

function Test-Action {
  param($label, $body)
  try {
    $json = $body | ConvertTo-Json -Depth 10
    $res = Invoke-RestMethod -Uri $base -Method POST -Body $json -ContentType "application/json"
    if ($res.success) {
      Write-Host "PASS  $label" -ForegroundColor Green
    } else {
      Write-Host "FAIL  $label  $($res.error)" -ForegroundColor Red
    }
  } catch {
    Write-Host "ERROR $label  $($_.Exception.Message)" -ForegroundColor Red
  }
}

Write-Host "=== HTU WELFARE SYSTEM API HANDLER AUDIT ===" -ForegroundColor Cyan

# 1. GET Portal State
try {
  $get = Invoke-RestMethod -Uri $base -Method GET
  Write-Host "PASS  GET /api/portal  Members:$($get.members.Count) Claims:$($get.claims.Count) Loans:$($get.loans.Count) Activities:$($get.activities.Count)" -ForegroundColor Green
} catch {
  Write-Host "FAIL  GET /api/portal  $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Register Member
Test-Action "registerMember" @{
  action = "registerMember"
  payload = @{
    firstName = "Audit"; lastName = "TestUser"
    staffId = "HTU/AUD-999"; union = "TUTAG"
    phone = "0244000000"; email = "audit@htu.edu.gh"
    department = "Engineering"; employmentDate = "2024-01-01"
  }
}

# 3. Record Dues Payment
Test-Action "recordPayment" @{
  action = "recordPayment"
  payload = @{
    memberId = "HTU/AUD-999"; month = "July 2026"
    amount = "25"; method = "Mobile Money"; memberName = "Audit TestUser"
  }
}

# 4. Submit Claim
$claimId = "CLM-AUD-001"
Test-Action "submitClaim" @{
  action = "submitClaim"
  payload = @{
    id = $claimId; applicant = "Audit TestUser"; index = "HTU/AUD-999"
    type = "Critical Illness"; amount = 1500
    notes = "Audit test claim submission."; userProfileName = "Audit TestUser"
  }
}

# 5. Submit Loan
$loanId = "LN-AUD-001"
Test-Action "submitLoan" @{
  action = "submitLoan"
  payload = @{
    id = $loanId; applicant = "Audit TestUser"; index = "HTU/AUD-999"
    amount = 500; term = "2 months"
    reason = "Audit test loan."; monthlyInstallment = 250
  }
}

# 6. Approve Claim
Test-Action "approveClaim" @{
  action = "approveClaim"
  payload = @{ claimId = $claimId; amount = 1500; userProfileName = "Scheme Manager" }
}

# 7. Approve Loan
Test-Action "approveLoan" @{
  action = "approveLoan"
  payload = @{ loanId = $loanId; userProfileName = "Scheme Manager" }
}

# 8. Settle Loan Installment
Test-Action "settleInstallment" @{
  action = "settleInstallment"
  payload = @{ loanId = $loanId; paymentAmount = 250; userProfileName = "Audit TestUser" }
}

# 9. Submit + Reject Claim
$claimId2 = "CLM-AUD-002"
Test-Action "submitClaim (for rejection)" @{
  action = "submitClaim"
  payload = @{
    id = $claimId2; applicant = "Audit TestUser"; index = "HTU/AUD-999"
    type = "Retirement"; amount = 4000
    notes = "Rejection test."; userProfileName = "Audit TestUser"
  }
}
Test-Action "rejectClaim" @{
  action = "rejectClaim"
  payload = @{ claimId = $claimId2; userProfileName = "Scheme Manager" }
}

# 10. Submit + Reject Loan
$loanId2 = "LN-AUD-002"
Test-Action "submitLoan (for rejection)" @{
  action = "submitLoan"
  payload = @{
    id = $loanId2; applicant = "Audit TestUser"; index = "HTU/AUD-999"
    amount = 300; term = "3 months"
    reason = "Rejection test loan."; monthlyInstallment = 100
  }
}
Test-Action "rejectLoan" @{
  action = "rejectLoan"
  payload = @{ loanId = $loanId2; userProfileName = "Scheme Manager" }
}

# 11. Send SMS
Test-Action "sendSMS" @{
  action = "sendSMS"
  payload = @{
    type = "Audit Broadcast"; recipients = "All Members (Test)"
    message = "This is an API audit test broadcast message."; userProfileName = "Scheme Manager"
  }
}

# 12. Generate Report
Test-Action "generateReport" @{
  action = "generateReport"
  payload = @{ name = "Quarterly Financial Statement"; period = "Q3 2026 Test"; userProfileName = "Scheme Manager" }
}

# 13. Mark All Notifications Read
Test-Action "markAllNotifRead" @{ action = "markAllNotifRead" }

# 14. Login Log
Test-Action "addLoginLog" @{
  action = "addLoginLog"
  payload = @{ email = "manager@htu.edu.gh" }
}

Write-Host ""
Write-Host "=== AUDIT COMPLETE ===" -ForegroundColor Cyan
