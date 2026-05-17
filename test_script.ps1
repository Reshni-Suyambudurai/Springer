$b = @{email="mozhi@kanini.com";password="password123"} | ConvertTo-Json
$l = Invoke-RestMethod -Uri http://localhost:8080/api/auth/login -Method POST -Body $b -ContentType "application/json"
$t = $l.data.token; $h = @{Authorization="Bearer $t"}
$sw=[System.Diagnostics.Stopwatch]::new()

Write-Host "=== TA_MANAGER API Tests ==="

$sw.Start(); $r = Invoke-RestMethod -Uri "http://localhost:8080/api/offers?cycleId=3&page=0&size=20" -Headers $h; $sw.Stop()
Write-Host "/offers $($sw.ElapsedMilliseconds)ms count=$($r.data.totalElements)"

$sw.Restart(); $r = Invoke-RestMethod -Uri "http://localhost:8080/api/offers/offer-ready?cycleId=3" -Headers $h; $sw.Stop()
Write-Host "/offers/offer-ready $($sw.ElapsedMilliseconds)ms count=$($r.data.Count)"

$stages = @('APPLIED','SHORTLISTED','INVITED','SCHEDULED','SELECTED','OFFERED','JOINED','NOT_JOINED','OFFER_REJECTED','REJECTED','OFFER_ACCEPTED','DROPPED')
foreach ($stage in $stages) {
  $body = @{cycleId=3;applicationStages=@($stage);page=0;size=1} | ConvertTo-Json
  $sw.Restart(); $r = Invoke-RestMethod -Uri "http://localhost:8080/api/candidates/filter" -Method POST -Body $body -ContentType "application/json" -Headers $h; $sw.Stop()
  Write-Host "/filter($stage) $($sw.ElapsedMilliseconds)ms total=$($r.data.totalElements)"
}

$sw.Restart(); $r = Invoke-RestMethod -Uri "http://localhost:8080/api/hiring-cycles" -Headers $h; $sw.Stop()
foreach ($c in $r.data) { Write-Host "Cycle id=$($c.id) name=$($c.cycleName) year=$($c.year) status=$($c.status)" }

Write-Host "=== DONE ==="
