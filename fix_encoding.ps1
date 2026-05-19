$ErrorActionPreference = 'Stop'
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
$win1252 = [System.Text.Encoding]::GetEncoding(1252)

# Files that were damaged by the previous PS re-encoding script
$psFiles = @(
    "c:\Users\BavigaddaManohar\Downloads\Springer\springer_frontend\src\components\TA_Recruiter\DocumentProcessing\SendDocumentsTab.tsx",
    "c:\Users\BavigaddaManohar\Downloads\Springer\springer_frontend\src\App.tsx",
    "c:\Users\BavigaddaManohar\Downloads\Springer\springer_frontend\src\components\TA_Recruiter\Settings\EligibilityManagement.tsx",
    "c:\Users\BavigaddaManohar\Downloads\Springer\springer_frontend\src\components\Academy\TrainingCoordinator\JoiningTracker.tsx",
    "c:\Users\BavigaddaManohar\Downloads\Springer\springer_frontend\src\components\TA_Recruiter\Institutes\InstitutesList.tsx",
    "c:\Users\BavigaddaManohar\Downloads\Springer\springer_frontend\src\components\TA_Recruiter\Institutes\AddInstitute.tsx",
    "c:\Users\BavigaddaManohar\Downloads\Springer\springer_frontend\src\components\TA_Recruiter\DocumentProcessing\OffersTab.tsx",
    "c:\Users\BavigaddaManohar\Downloads\Springer\springer_frontend\src\components\TA_Recruiter\DocumentProcessing\DocumentTypesTab.tsx",
    "c:\Users\BavigaddaManohar\Downloads\Springer\springer_frontend\src\components\TA_Recruiter\DocumentProcessing\DocumentProcessingDashboard.tsx",
    "c:\Users\BavigaddaManohar\Downloads\Springer\springer_frontend\src\components\HiringManager\HiringDemand\HiringDemandDetails.tsx",
    "c:\Users\BavigaddaManohar\Downloads\Springer\springer_frontend\src\components\TA_Recruiter\Candidates\CandidateFilter.tsx",
    "c:\Users\BavigaddaManohar\Downloads\Springer\springer_frontend\src\components\TA_Recruiter\Candidates\ScheduleDrive.tsx",
    "c:\Users\BavigaddaManohar\Downloads\Springer\springer_frontend\src\components\TA_Recruiter\Candidates\CandidateList.tsx",
    "c:\Users\BavigaddaManohar\Downloads\Springer\springer_frontend\src\components\TA_Head\HiringCycle\HiringCycleList.tsx",
    "c:\Users\BavigaddaManohar\Downloads\Springer\springer_frontend\src\components\TA_Head\HiringCycle\HiringCycleDetails.tsx",
    "c:\Users\BavigaddaManohar\Downloads\Springer\springer_frontend\src\components\HiringManager\HiringCycle\HiringCycleList.tsx",
    "c:\Users\BavigaddaManohar\Downloads\Springer\springer_frontend\src\components\HiringManager\HiringCycle\HiringCycleDetails.tsx",
    "c:\Users\BavigaddaManohar\Downloads\Springer\springer_frontend\src\components\TA_Recruiter\DriveProcess\DriveList.tsx",
    "c:\Users\BavigaddaManohar\Downloads\Springer\springer_frontend\src\components\TA_Recruiter\DriveProcess\DriveDetails.tsx",
    "c:\Users\BavigaddaManohar\Downloads\Springer\springer_frontend\src\components\Academy\TrainingCoordinator\AcademyDashboard.tsx"
)

Write-Host "=== Step 1: Undoing PS re-encoding damage on 20 files ==="
foreach ($file in $psFiles) {
    if (Test-Path $file) {
        $text = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
        if ($text.Length -gt 0 -and $text[0] -eq [char]0xFEFF) { $text = $text.Substring(1) }
        $bytes = $win1252.GetBytes($text)
        $text = [System.Text.Encoding]::UTF8.GetString($bytes)
        [System.IO.File]::WriteAllText($file, $text, $utf8NoBom)
        Write-Host "  Reversed: $(Split-Path $file -Leaf)"
    } else {
        Write-Host "  NOT FOUND: $file"
    }
}

Write-Host ""
Write-Host "=== Step 2: Fixing all mojibake in ALL tsx files ==="

$srcDir = "c:\Users\BavigaddaManohar\Downloads\Springer\springer_frontend\src"
$allTsx = Get-ChildItem -Path $srcDir -Filter "*.tsx" -Recurse
$fixedCount = 0

foreach ($f in $allTsx) {
    $text = [System.IO.File]::ReadAllText($f.FullName, $utf8NoBom)
    $orig = $text

    # em-dash mojibake: U+00E2 U+20AC U+201D -> U+2014
    $broken = [string]::new(@([char]0x00E2, [char]0x20AC, [char]0x201D))
    $text = $text.Replace($broken, [string][char]0x2014)

    # en-dash mojibake: U+00E2 U+20AC U+201C -> U+2013
    # (just in case; most should be em-dash)
    # Actually skip this - U+00E2 U+20AC U+201C could conflict with down-arrow in some contexts

    # rupee: U+00E2 U+201A U+00B9 -> U+20B9
    $broken = [string]::new(@([char]0x00E2, [char]0x201A, [char]0x00B9))
    $text = $text.Replace($broken, [string][char]0x20B9)

    # right arrow: U+00E2 U+2020 U+2019 -> U+2192
    $broken = [string]::new(@([char]0x00E2, [char]0x2020, [char]0x2019))
    $text = $text.Replace($broken, [string][char]0x2192)

    # down arrow: U+00E2 U+2020 U+201C -> U+2193
    $broken = [string]::new(@([char]0x00E2, [char]0x2020, [char]0x201C))
    $text = $text.Replace($broken, [string][char]0x2193)

    # check mark: U+00E2 U+0153 U+201C -> U+2713  (but beware: this is actually U+201C not U+0022)
    # Wait: checkmark U+2713 = E2 9C 93, Win1252: E2->U+00E2, 9C->U+0153, 93->U+201C
    $broken = [string]::new(@([char]0x00E2, [char]0x0153, [char]0x201C))
    $text = $text.Replace($broken, [string][char]0x2713)

    # less-equal: U+00E2 U+2030 U+00A4 -> U+2264
    $broken = [string]::new(@([char]0x00E2, [char]0x2030, [char]0x00A4))
    $text = $text.Replace($broken, [string][char]0x2264)

    # check emoji: U+00E2 U+0153 U+2026 -> U+2705
    $broken = [string]::new(@([char]0x00E2, [char]0x0153, [char]0x2026))
    $text = $text.Replace($broken, [string][char]0x2705)

    # circle: U+00E2 U+2014 U+2039 -> U+25CB
    $broken = [string]::new(@([char]0x00E2, [char]0x2014, [char]0x2039))
    $text = $text.Replace($broken, [string][char]0x25CB)

    # bullet: U+00E2 U+20AC U+00A2 -> U+2022
    $broken = [string]::new(@([char]0x00E2, [char]0x20AC, [char]0x00A2))
    $text = $text.Replace($broken, [string][char]0x2022)

    # fire emoji: U+00F0 U+0178 U+201D U+00A5 -> U+1F525
    $broken = [string]::new(@([char]0x00F0, [char]0x0178, [char]0x201D, [char]0x00A5))
    $text = $text.Replace($broken, [char]::ConvertFromUtf32(0x1F525))

    # green circle: U+00F0 U+0178 U+0178 U+00A2 -> U+1F7E2
    $broken = [string]::new(@([char]0x00F0, [char]0x0178, [char]0x0178, [char]0x00A2))
    $text = $text.Replace($broken, [char]::ConvertFromUtf32(0x1F7E2))

    # red circle: U+00F0 U+0178 U+201D U+00B4 -> U+1F534
    $broken = [string]::new(@([char]0x00F0, [char]0x0178, [char]0x201D, [char]0x00B4))
    $text = $text.Replace($broken, [char]::ConvertFromUtf32(0x1F534))

    # box drawing horizontal: U+00E2 U+201D U+20AC -> U+2500
    $broken = [string]::new(@([char]0x00E2, [char]0x201D, [char]0x20AC))
    $text = $text.Replace($broken, [string][char]0x2500)

    # box drawing double horizontal: U+00E2 U+2022 U+0090 -> U+2550
    $broken = [string]::new(@([char]0x00E2, [char]0x2022, [char]0x0090))
    $text = $text.Replace($broken, [string][char]0x2550)

    if ($text -ne $orig) {
        [System.IO.File]::WriteAllText($f.FullName, $text, $utf8NoBom)
        $fixedCount++
        Write-Host "  Fixed: $($f.Name)"
    }
}

Write-Host ""
Write-Host "=== Done! Fixed $fixedCount files ==="
