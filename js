#! /bin/sh
set -eu

FILE_OR_PKGS=${PKGS:-$*}
ARGS=${ARGS:-}

export NIXPKGS_ALLOW_BROKEN=1
export NIXPKGS_ALLOW_UNFREE=1

if [ "$(uname -s)" = "Darwin" ]; then
    export NIX_PATH="nixpkgs=channel:nixpkgs-19.03-darwin"
    echo "Using darwin NIX_PATH: $NIX_PATH"
else
	export NIX_PATH="nixpkgs=channel:nixos-19.03"
	echo "Using standard NIX_PATH: $NIX_PATH"
fi

devtools="pkgconfig ctags z3 hlint cabal-install haskellPackages.hasktags haskellPackages.pointfree haskellPackages.stylish-haskell haskellPackages.hindent haskellPackages.hoogle pkgs.haskell.packages.ghc844.pointful"
devtools2="(import<n1809>{}).haskell.packages.ghc844.brittany.override{ghc-exactprint=haskell.lib.dontCheck((import(fetchTarball(https://github.com/NixOS/nixpkgs-channels/archive/nixos-18.09.tar.gz)){}).haskell.packages.ghc844.ghc-exactprint);}"
devtools3="(import<n1809>{}).haskell.packages.ghc844.apply-refact.override{ghc-exactprint=haskell.lib.dontCheck((import(fetchTarball(https://github.com/NixOS/nixpkgs-channels/archive/nixos-18.09.tar.gz)){}).haskell.packages.ghc844.ghc-exactprint);}"
devtools4="(import<n1809>{}).haskell.packages.ghc844.pointful"
devtools5="(import<n1809>{}).haskell.packages.ghc844.hsimport"
devtools6="(import<n1803>{}).haskell.packages.ghc822.liquidhaskell"

NIX_EXTRA_OPTIONS="--option extra-substituters https://binarycache.lahteenmaki.net --option trusted-public-keys"
NIX_EXTRA_OPTIONS2="binarycache.lahteenmaki.net:7Sy5MuTu2SYzROwvDIYCJHiR5Xk7SDYPxdXcB9XTVrw= cache.nixos.org-1:6NCHdD59X431o0gWypbMrAURkbJ16ZPMQFGspcDShjY="

case $FILE_OR_PKGS in
	# Create shell environment based on a given cabal file
	*.cabal)
		nix-shell -p cabal2nix --run "cabal2nix --compiler ghcjs --shell $(dirname $FILE_OR_PKGS) > /tmp/hs.nix"
		# orig_path trick because nix-shell orders path in an odd way: https://github.com/NixOS/nix/issues/1671
		nix-shell -I n1803=channel:nixos-18.03 -I n1809=channel:nixos-18.09 -p $devtools $devtools2 $devtools3 $devtools4 $devtools5 $devtools6 $NIX_EXTRA_OPTIONS "$NIX_EXTRA_OPTIONS2" --command "export ORIG_PATH=\$PATH; nix-shell --pure --keep ORIG_PATH $ARGS --argstr compiler ghcjs --command 'export PATH=\$PATH:\$ORIG_PATH; return' /tmp/hs.nix"
		;;
	# Create shell environment based no a given nix file (e.g. ./default.nix)
	*.nix)
		# orig_path trick because nix-shell orders path in an odd way: https://github.com/NixOS/nix/issues/1671
		nix-shell -I n1803=channel:nixos-18.03 -I n1809=channel:nixos-18.09 -p $devtools $devtools2 $devtools3 $devtools4 $devtools5 $devtools6 $NIX_EXTRA_OPTIONS "$NIX_EXTRA_OPTIONS2" --command "export ORIG_PATH=\$PATH; nix-shell --pure --keep ORIG_PATH $ARGS --argstr compiler ghcjs --command 'export PATH=\$PATH:\$ORIG_PATH; return' $FILE_OR_PKGS"
		;;
	# Assume a list of haskell packages was given, and create an environment with those packages
	*)
		nix-shell -I n1803=channel:nixos-18.03 -I n1809=channel:nixos-18.09 $ARGS -p $devtools $devtools2 $devtools3 $devtools4 $devtools5 $devtools6 $NIX_EXTRA_OPTIONS "$NIX_EXTRA_OPTIONS2" --command "export ORIG_PATH=\$PATH; nix-shell --pure --keep ORIG_PATH $ARGS -p \"haskell.packages.ghcjs.ghcWithPackages (p: with p; [$FILE_OR_PKGS])\" --argstr compiler ghcjs --command 'export PATH=\$PATH:\$ORIG_PATH; return'"
		;;
esac
