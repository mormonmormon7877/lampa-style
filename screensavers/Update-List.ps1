$saverFiles = @(Get-ChildItem -LiteralPath $PSScriptRoot -File | Where-Object { $_.Extension.ToLowerInvariant() -in @('.jpg','.jpeg','.png','.webp','.svg','.mp4','.webm') } | Sort-Object Name | ForEach-Object { $_.Name })
$saverJson = @{ files = $saverFiles } | ConvertTo-Json -Depth 3
[System.IO.File]::WriteAllText((Join-Path $PSScriptRoot 'manifest.json'), $saverJson, (New-Object System.Text.UTF8Encoding($false)))
Write-Output 'manifest.json updated. Upload it together with your images and videos.'
