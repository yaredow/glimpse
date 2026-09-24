{
  description = "Glimps development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs =
    { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs { inherit system; };
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        packages = with pkgs; [
          go
          air
          golangci-lint
          go-migrate
          postgresql_16
          bun
        ];
        shellHook = ''
          echo "Welcome to Glimps Development Environment"
          echo "Go: $(go version)"
          echo "Bun: $(bun --version)"
        '';
      };
    };

}
