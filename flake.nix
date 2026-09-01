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
      in {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_22
            nodePackages.pnpm
            nodePackages.typescript
            nil
            nixpkgs-fmt
          ];
          shellHook = ''
            echo "oseille devShell — node $(node --version) pnpm $(pnpm --version)"
          '';
        };

        packages.default = pkgs.buildNpmPackage {
          pname = "oseille";
          version = "0.1.0";
          src = ./.;
          npmDepsHash = "sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
          installPhase = ''
            mkdir -p $out
            cp -r dist/* $out/ 2>/dev/null || echo "no dist — run pnpm build first"
          '';
        };

        checks = {
          # placeholder — wired once tests exist
        };
      });
}
