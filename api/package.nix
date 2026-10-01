{ lib, buildGoModule }:

buildGoModule {
  pname = "glimpse-api";
  version = "0.1.0";

  src = lib.fileset.toSource {
    root = ./.;
    fileset = lib.fileset.unions [
      ./cmd
      ./internal
      ./vendor
      ./go.mod
      ./go.sum
    ];
  };

  vendorHash = null;
  subPackages = [ "cmd/api" ];

  meta = {
    description = "Glimpse movie recommendation API";
    mainProgram = "api";
  };
}
