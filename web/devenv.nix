{ pkgs, ... }:

{
  languages.javascript = {
    enable = true;
    bun.enable = true;
  };

  enterShell = ''
    echo "✨ Glimpse Web (Next.js) Environment Ready"
    echo "Bun: $(bun --version)"
  '';
}

