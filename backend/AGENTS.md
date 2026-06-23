# Backend development rules

- Do not use the broad `import pytest` form. Import only the pytest symbols
  required by a test, for example `from pytest import fixture`.
- Keep all imports at module scope at the top of the file. Do not place imports
  inside functions, methods, fixtures, or other runtime blocks.
- Remove unused imports.
