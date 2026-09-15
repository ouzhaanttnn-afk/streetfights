Add-Type -AssemblyName System.Drawing

$inputFiles = @(
    'C:\Users\Gaming\.gemini\antigravity\brain\3bd25d80-e319-4428-a158-ffc3eeea0051\.user_uploaded\media_1789458584972.jpg',
    'C:\Users\Gaming\.gemini\antigravity\brain\3bd25d80-e319-4428-a158-ffc3eeea0051\.user_uploaded\media_1789458584974.jpg',
    'C:\Users\Gaming\.gemini\antigravity\brain\3bd25d80-e319-4428-a158-ffc3eeea0051\.user_uploaded\media_1789458584979.jpg',
    'C:\Users\Gaming\.gemini\antigravity\brain\3bd25d80-e319-4428-a158-ffc3eeea0051\.user_uploaded\media_1789458584982.jpg',
    'C:\Users\Gaming\.gemini\antigravity\brain\3bd25d80-e319-4428-a158-ffc3eeea0051\.user_uploaded\media_1789458584988.jpg'
)

$outDir67 = 'C:\Users\Gaming\Desktop\AppStore_Screenshots_6.7'
$outDir65 = 'C:\Users\Gaming\Desktop\AppStore_Screenshots_6.5'

if (!(Test-Path $outDir67)) { New-Item -ItemType Directory -Path $outDir67 -Force }
if (!(Test-Path $outDir65)) { New-Item -ItemType Directory -Path $outDir65 -Force }

function Resize-Image($srcPath, $dstPath, $targetW, $targetH) {
    $srcImg = [System.Drawing.Image]::FromFile($srcPath)
    $destBitmap = New-Object System.Drawing.Bitmap($targetW, $targetH, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $destBitmap.SetResolution(72, 72)
    
    $g = [System.Drawing.Graphics]::FromImage($destBitmap)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $g.DrawImage($srcImg, 0, 0, $targetW, $targetH)
    
    $destBitmap.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $g.Dispose()
    $destBitmap.Dispose()
    $srcImg.Dispose()
}

for ($i = 0; $i -lt $inputFiles.Count; $i++) {
    $num = $i + 1
    $src = $inputFiles[$i]
    $out67 = Join-Path $outDir67 "screenshot_${num}.png"
    $out65 = Join-Path $outDir65 "screenshot_${num}.png"
    
    Resize-Image $src $out67 1290 2796
    Resize-Image $src $out65 1242 2688
    Write-Host "Processed screenshot_${num}.png -> 6.7 in (1290x2796) and 6.5 in (1242x2688)"
}

Write-Host "All screenshots processed successfully!"
