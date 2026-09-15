Add-Type -AssemblyName System.Drawing

$inputFiles = @(
    'C:\Users\Gaming\.gemini\antigravity\brain\3bd25d80-e319-4428-a158-ffc3eeea0051\.user_uploaded\media_1789458584972.jpg',
    'C:\Users\Gaming\.gemini\antigravity\brain\3bd25d80-e319-4428-a158-ffc3eeea0051\.user_uploaded\media_1789458584974.jpg',
    'C:\Users\Gaming\.gemini\antigravity\brain\3bd25d80-e319-4428-a158-ffc3eeea0051\.user_uploaded\media_1789458584979.jpg',
    'C:\Users\Gaming\.gemini\antigravity\brain\3bd25d80-e319-4428-a158-ffc3eeea0051\.user_uploaded\media_1789458584982.jpg',
    'C:\Users\Gaming\.gemini\antigravity\brain\3bd25d80-e319-4428-a158-ffc3eeea0051\.user_uploaded\media_1789458584988.jpg'
)

$outDirPad = 'C:\Users\Gaming\Desktop\AppStore_Screenshots_iPad_13'
if (!(Test-Path $outDirPad)) { New-Item -ItemType Directory -Path $outDirPad -Force }

for ($i = 0; $i -lt $inputFiles.Count; $i++) {
    $num = $i + 1
    $src = $inputFiles[$i]
    $outPad = Join-Path $outDirPad "screenshot_${num}.png"
    
    $srcImg = [System.Drawing.Image]::FromFile($src)
    $destBitmap = New-Object System.Drawing.Bitmap(2048, 2732, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $destBitmap.SetResolution(72, 72)
    
    $g = [System.Drawing.Graphics]::FromImage($destBitmap)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $g.DrawImage($srcImg, 0, 0, 2048, 2732)
    $destBitmap.Save($outPad, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $g.Dispose()
    $destBitmap.Dispose()
    $srcImg.Dispose()
    Write-Host "Processed iPad screenshot_${num}.png (2048x2732)"
}

Write-Host "All iPad screenshots ready!"
