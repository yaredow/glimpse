{
  description = "Glimps development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs =
    { self, nixpkgs }:
    let
      system = [
        "x86_64-linux"
        "aarch64-linux"
        "aarch64-darwin"
      ];

      forAllSystems =
        f:
        nixpkgs.lib.genAttrs system (
          system:
          f {
            pkgs = import nixpkgs { inherit system; };

          }
        );
    in

    {
      packages = forAllSystems (
        { pkgs }: {
          default = pkgs.callPackage ./api/package.nix { };
          api = pkgs.callPackage ./api/package.nix { };
          app = pkgs.callPackage ./app/package.nix { };
        }
      );

      devShells = forAllSystems (
        { pkgs }: {
          default = pkgs.mkShell {
            packages = with pkgs; [
              go
              air
              android-tools
              golangci-lint
              (go-migrate.overrideAttrs { tags = [ "postgres" ]; })
              postgresql_16
              bun
            ];

            shellHook = ''
              echo "✨ Welcome to Glimpse
              Development Environment"
              echo "Go:  $(go version)"
              echo "Bun: $(bun --version)"
            '';

          };

        }
      );

    };
}
