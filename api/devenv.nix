{ pkgs, ... }:

{
  languages.go.enable = true;

  packages = with pkgs; [
    air
    golangci-lint
    (go-migrate.overrideAttrs { tags = [ "postgres" ]; })
    postgresql_16
  ];

  enterShell = ''
    echo "✨ Glimpse API (Go) Environment Ready"
    echo "Go: $(go version)"
  '';
}

