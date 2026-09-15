# Third-Party Notices

This file records npm packages bundled into the browser-facing static assets. It is generated from [package-lock.json](package-lock.json) and intentionally excludes Astro, Tailwind, Sharp, TypeScript, and other build-time dependencies that are not included in `dist/`.

Run `npm run licenses` after changing dependencies and review the result before committing. The package links below identify the corresponding license and source metadata published by each package. Full license and notice texts are preserved in [third-party-licenses/](third-party-licenses/).

## Project Attributions

- The visual structure and DarkMinimal styling are adapted from [Gothsec/dark-minimal](https://github.com/Gothsec/dark-minimal), which is released under the MIT License.
- The `LetterGlitch` component originates from the DarkMinimal template's ReactBits integration. See [ReactBits](https://www.reactbits.dev/) and the [DarkMinimal source](https://github.com/Gothsec/dark-minimal).
- Montserrat variable font files are provided through [Fontsource](https://fontsource.org/), under the SIL Open Font License 1.1. The package is listed below as `@fontsource-variable/montserrat`.
- The technology icons under `public/svg` were downloaded from [Devicon](https://github.com/devicons/devicon), which is released under the MIT License.
- Microsoft certification badges and technology logos are third-party brand assets. They are not relicensed by this repository's MIT license; retain their source and trademark terms when redistributing them.

## License Summary

- MIT: 2 packages
- OFL-1.1: 1 package

## Package Inventory

| Package | Version | License | Scope | Full text |
| --- | --- | --- | --- | --- |
| [@fontsource-variable/montserrat](https://www.npmjs.com/package/@fontsource-variable/montserrat) | 5.3.0 | OFL-1.1 | distributed | [full text](third-party-licenses/at-fontsource-variable-montserrat-f429f7393512.txt) |
| [react](https://www.npmjs.com/package/react) | 19.3.0 | MIT | distributed | [full text](third-party-licenses/react-da6d3703ed11.txt) |
| [react-dom](https://www.npmjs.com/package/react-dom) | 19.3.0 | MIT | distributed | [full text](third-party-licenses/react-da6d3703ed11.txt) |

## Notes

- This inventory covers only packages bundled into the generated browser assets.
- A package's license applies to that package and its authors; the project's MIT license applies only to original project code that Oliver Slater can license.
- Every redistributed package entry links to a preserved full license or notice text collected from its installed package metadata.
- The distributed package set is maintained explicitly in `distributedPackageNames` above. Recheck it when generated browser assets change.
