{
  description = "oseille — PWA prix fruits & légumes France";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_22
            pnpm
            typescript
            nil
            nixpkgs-fmt
          ];
          shellHook = ''
            echo "oseille devShell — node $(node --version) pnpm $(pnpm --version)"
            [ -d node_modules ] || npm install
          '';
        };

        packages.default = pkgs.buildNpmPackage {
          pname = "oseille";
          version = "0.1.0";
          src = ./.;
          npmDepsHash = "sha256-p83DIpqOEjUBZD+zwnNScWz9u/Y8poHpec8R1QsTCfQ=";
          installPhase = ''
            mkdir -p $out
            cp -r dist/* $out/ 2>/dev/null || echo "no dist — run pnpm build first"
          '';
        };

        checks = {
          lint = pkgs.runCommand "lint" { buildInputs = [ pkgs.nodejs_22 ]; } ''
            npm run lint
          '';
          typecheck = pkgs.runCommand "typecheck" { buildInputs = [ pkgs.nodejs_22 ]; } ''
            npx tsc --noEmit
          '';
          build = pkgs.runCommand "build" { buildInputs = [ pkgs.nodejs_22 ]; } ''
            npm run build
          '';
          test-integration = pkgs.runCommand "test-integration" { buildInputs = [ pkgs.nodejs_22 ]; } ''
            npm run test:integration
          '';
          test-pwa = pkgs.runCommand "test-pwa" { buildInputs = [ pkgs.nodejs_22 ]; } ''
            npm run test:pwa
          '';
        };
      });
}
