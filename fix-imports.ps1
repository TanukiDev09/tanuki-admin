$files = Get-ChildItem -Recurse -Path "src" -Filter "*.tsx"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $modified = $false
    
    if ($content -match '@/components/ui/card[''"]') {
        $content = $content -replace '@/components/ui/card', '@/components/ui/Card'
        $modified = $true
    }
    if ($content -match '@/components/ui/button[''"]') {
        $content = $content -replace '@/components/ui/button', '@/components/ui/Button'
        $modified = $true
    }
    if ($content -match '@/components/ui/badge[''"]') {
        $content = $content -replace '@/components/ui/badge', '@/components/ui/Badge'
        $modified = $true
    }
    if ($content -match '@/components/ui/input[''"]') {
        $content = $content -replace '@/components/ui/input', '@/components/ui/Input'
        $modified = $true
    }
    if ($content -match '@/components/ui/label[''"]') {
        $content = $content -replace '@/components/ui/label', '@/components/ui/Label'
        $modified = $true
    }
    if ($content -match '@/components/ui/select[''"]') {
        $content = $content -replace '@/components/ui/select', '@/components/ui/Select'
        $modified = $true
    }
    if ($content -match '@/components/ui/dialog[''"]') {
        $content = $content -replace '@/components/ui/dialog', '@/components/ui/Dialog'
        $modified = $true
    }
    if ($content -match '@/components/ui/table[''"]') {
        $content = $content -replace '@/components/ui/table', '@/components/ui/Table'
        $modified = $true
    }
    if ($content -match '@/components/ui/textarea[''"]') {
        $content = $content -replace '@/components/ui/textarea', '@/components/ui/Textarea'
        $modified = $true
    }
    if ($content -match '@/components/ui/checkbox[''"]') {
        $content = $content -replace '@/components/ui/checkbox', '@/components/ui/Checkbox'
        $modified = $true
    }
    if ($content -match '@/components/ui/separator[''"]') {
        $content = $content -replace '@/components/ui/separator', '@/components/ui/Separator'
        $modified = $true
    }
    if ($content -match '@/components/ui/tabs[''"]') {
        $content = $content -replace '@/components/ui/tabs', '@/components/ui/Tabs'
        $modified = $true
    }
    if ($content -match '@/components/ui/popover[''"]') {
        $content = $content -replace '@/components/ui/popover', '@/components/ui/Popover'
        $modified = $true
    }
    if ($content -match '@/components/ui/dropdown-menu[''"]') {
        $content = $content -replace '@/components/ui/dropdown-menu', '@/components/ui/DropdownMenu'
        $modified = $true
    }
    
    if ($modified) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Fixed: $($file.FullName)"
    }
}

Write-Host "Done!"
