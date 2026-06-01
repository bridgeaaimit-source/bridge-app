$files = Get-ChildItem -Path "c:\Users\lenovo\.gemini\antigravity-ide\scratch\bridge-app\components\landing-v2" -Filter "*.js" -Recurse

foreach ($file in $files) {
    # Skip ScrollReveal and FloatAnimation
    if ($file.Name -eq "ScrollReveal.js" -or $file.Name -eq "FloatAnimation.js") {
        continue
    }

    $content = Get-Content $file.FullName -Raw

    $newContent = $content -replace 'import\s+\{\s*motion(\s*,\s*[^}]+)?\s*\}\s+from\s+["'']framer-motion["'']', 'import { m$1 } from "framer-motion"'
    $newContent = $newContent -replace '<motion\.', '<m.'
    $newContent = $newContent -replace '</motion\.', '</m.'

    # Also handle the case where it might be `import { something, motion, something }`
    # Just a simple global replace for the import statement might be better:
    if ($newContent -match 'import \{.*motion.*\} from ["'']framer-motion["'']') {
        $newContent = $newContent -replace '\bmotion\b', 'm'
    }

    if ($content -ne $newContent) {
        Set-Content -Path $file.FullName -Value $newContent
        Write-Output "Updated $($file.Name)"
    }
}
