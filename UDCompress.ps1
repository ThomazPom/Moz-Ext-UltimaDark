# target path
del ./UltimaDark.zip
$path = "./"
# construct archive path
$DateTime = (Get-Date -Format "yyyyMMddHHmmss")
$destination = Join-Path $path "./UltimaDark.zip"
# exclusion rules. Can use wild cards (*)
$exclude = @("*.ps1","other-tools-and-tests","*.zip")
# get files to compress using exclusion filer
$files = Get-ChildItem -Path $path -Exclude $exclude
# compress
Compress-Archive -Path $files -DestinationPath $destination -CompressionLevel Fastest