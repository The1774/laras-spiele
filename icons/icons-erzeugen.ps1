# Erzeugt icons/icon-512.png und icons/icon-192.png aus derselben Zeichnung
# wie icons/logo.svg – mit System.Drawing (in Windows PowerShell enthalten).
Add-Type -AssemblyName System.Drawing

$ziel = Join-Path $PSScriptRoot "."   # Zielordner = dieser Ordner (icons/)

function Zeichne([int]$groesse) {
    $bmp = New-Object System.Drawing.Bitmap $groesse, $groesse
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)
    $s = $groesse / 512.0   # Skalierung relativ zur 512er-Vorlage
    $g.ScaleTransform($s, $s)

    # Abgerundeter Hintergrund mit Verlauf Flieder -> Rosa
    $pfad = New-Object System.Drawing.Drawing2D.GraphicsPath
    $r = 112; $d = 2 * $r
    $pfad.AddArc(0, 0, $d, $d, 180, 90)
    $pfad.AddArc(512 - $d, 0, $d, $d, 270, 90)
    $pfad.AddArc(512 - $d, 512 - $d, $d, $d, 0, 90)
    $pfad.AddArc(0, 512 - $d, $d, $d, 90, 90)
    $pfad.CloseFigure()
    $verlauf = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.Point 0, 0), (New-Object System.Drawing.Point 0, 512),
        [System.Drawing.ColorTranslator]::FromHtml("#e9d5ff"),
        [System.Drawing.ColorTranslator]::FromHtml("#fdf1f8"))
    $g.FillPath($verlauf, $pfad)

    # Stern oben links
    $stern = @(
        (New-Object System.Drawing.PointF 118, 96),  (New-Object System.Drawing.PointF 128, 124),
        (New-Object System.Drawing.PointF 156, 134), (New-Object System.Drawing.PointF 128, 144),
        (New-Object System.Drawing.PointF 118, 172), (New-Object System.Drawing.PointF 108, 144),
        (New-Object System.Drawing.PointF 80, 134),  (New-Object System.Drawing.PointF 108, 124))
    $g.FillPolygon((New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#ffd24a"))), $stern)

    # Regenbogen: vier Halbkreis-Bögen (Mittelpunkt 256/352)
    $farben = @("#ff8fcf", "#ffd24a", "#6ec6f0", "#b388eb")
    $radien = @(160, 128, 96, 64)
    for ($i = 0; $i -lt 4; $i++) {
        $stift = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml($farben[$i])), 30
        $stift.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
        $stift.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
        $rad = $radien[$i]
        $g.DrawArc($stift, 256 - $rad, 352 - $rad, 2 * $rad, 2 * $rad, 180, 180)
    }

    # Zwei Wölkchen an den Enden
    $weiss = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    foreach ($e in @(@(96,362,62,30), @(72,344,34,26), @(122,340,36,28), @(416,362,62,30), @(392,340,36,28), @(442,344,34,26))) {
        $g.FillEllipse($weiss, $e[0] - $e[2], $e[1] - $e[3], 2 * $e[2], 2 * $e[3])
    }

    $g.Dispose()
    return $bmp
}

foreach ($n in @(512, 192)) {
    $bmp = Zeichne $n
    $bmp.Save("$ziel\icon-$n.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "icon-$n.png geschrieben"
}
