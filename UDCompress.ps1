# target path
del ./UltimaDark.zip
del ./UltimaDark
$path = "./"
# construct archive path
$DateTime = (Get-Date -Format "yyyyMMddHHmmss")
$destination = Join-Path $path "./UltimaDark.zip"
# exclusion rules. Can use wild cards (*)
$exclude = @("*.ps1","other-tools-and-tests","gre-resources","*.zip","icons")
# get files to compress using exclusion filer
$files = Get-ChildItem -Path $path -Exclude $exclude
# compress
Compress-Archive -Path $files -DestinationPath $destination -CompressionLevel Optimal
echo "THX NOW DONT FORGET TO DRAG AND DROP ICONS AND RESOURCES INTO ARCHIVE"
pause