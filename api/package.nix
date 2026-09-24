{ lib, buildGoModule }:

buildGoModule {
  pname = "glimpse-api";
  version = "0.1.0";

  src = ./.;
  vendorHash = null;
  subPackages = [ "cmd/api" ];

  meta = {
    description = "Glimpse movie recommendation API";
    mainProgram = "api";
  };
}
