{
  lib,
  stdenv,
  bun,
  cacert,
  nodejs,
}:

let
  # Stage 1: Download node_modules
  nodeModules = stdenv.mkDerivation {
    pname = "glimpse-app-node-modules";
    version = "1.0.0";

    src = lib.fileset.toSource {
      root = ./.;
      fileset = lib.fileset.unions [
        ./package.json
        ./bun.lock
      ];
    };

    nativeBuildInputs = [
      bun
      cacert
    ];

    buildPhase = ''
      export HOME=$TMPDIR
      export SSL_CERT_FILE=${cacert}/etc/ssl/certs/ca-bundle.crt
      bun install --frozen-lockfile
    '';

    installPhase = ''
      cp -r node_modules $out
    '';

    dontFixup = true;

    outputHashAlgo = "sha256";
    outputHashMode = "recursive";
    outputHash = "sha256-mKHY/6B1o0fSjITuQKrxe5pKGHgL0zA6TM11MZ4rCas=";
  };

in
# Stage 2: Build the static website
stdenv.mkDerivation {
  pname = "glimpse-app-web";
  version = "1.0.0";

  src = ./.;

  nativeBuildInputs = [ bun nodejs ];

  buildPhase = ''
    export HOME=$TMPDIR
    export EXPO_CACHE_DIR=$TMPDIR/.expo
    export METRO_CACHE_DIR=$TMPDIR/.metro
    
    # Copy pre-fetched node_modules and make them writable and executable
    cp -r --no-preserve=mode ${nodeModules} node_modules
    chmod -R u+rwx node_modules
    patchShebangs node_modules

    export PATH="$PWD/node_modules/.bin:$PATH"

    # Export static web files to ./dist
    expo export --platform web
  '';

  installPhase = ''
    cp -r dist $out
  '';

  meta = {
    description = "Glimpse web export";
  };
}
