## [1.1.1](https://github.com/wmfs/tymly-fastify-plugin/compare/v1.1.0...v1.1.1) (2020-05-13)


### 🐛 Bug Fixes

* **upload:** Invoke state machine once upload is complete ([f8c5702](https://github.com/wmfs/tymly-fastify-plugin/commit/f8c570251d7aadaaabf8d5d34f049d8e9b4b2c50))
* **upload:** Save uploaded file to temp directory. ([9953c64](https://github.com/wmfs/tymly-fastify-plugin/commit/9953c64548ae4c2e21b797810b96dbc6730ea2dd))


### 🛠 Builds

* **dependencies:** Updated dependencies. Nearly all of them. ([528575d](https://github.com/wmfs/tymly-fastify-plugin/commit/528575df6b16d3d691807fda5aaf7d187a0959b2))
* **deps-dev:** update semantic-release dev dependencies ([b45881c](https://github.com/wmfs/tymly-fastify-plugin/commit/b45881c18845a34186e894dbd34e7b4c8d0ecdd4))


### 📦 Code Refactoring

* **services:** Remove callback parameter from service boot methods ([7d7c3d9](https://github.com/wmfs/tymly-fastify-plugin/commit/7d7c3d94a472dad92a31982a92b00b0c29c5eef5))
* **test:** Use await tymly.boot ([6c3f11a](https://github.com/wmfs/tymly-fastify-plugin/commit/6c3f11a2a136429b1639dfc295a8fff70b514bcf))
* **upload:** Remove happy path debug output ([0add03b](https://github.com/wmfs/tymly-fastify-plugin/commit/0add03b49da82402a1601bbbacb5a4e144235523))
* add upload route, log incoming info for now ([eb34b69](https://github.com/wmfs/tymly-fastify-plugin/commit/eb34b69204c2d8e7dd7d79440cb422f20c397752))
* launch state machine if one is specified ([9afba3b](https://github.com/wmfs/tymly-fastify-plugin/commit/9afba3b0f7a9e7efc584f7c9e01724d1b63f14b8))
* log some info about file, save form data, complete upload ([e65be83](https://github.com/wmfs/tymly-fastify-plugin/commit/e65be832800e4b23857b6ccbc590d1317d0a3772))
* pass file info into state machine ([55b68c9](https://github.com/wmfs/tymly-fastify-plugin/commit/55b68c942b27139bc54559b86523d9b5bef33ed6))


### 🚨 Tests

* **state-resources:** Remove unnecessary init methods ([7ac0cc3](https://github.com/wmfs/tymly-fastify-plugin/commit/7ac0cc3cd20d0c6f01e03ebbfd1379ac3cdcec2a))


### ⚙️ Continuous Integrations

* **circle:** add context env var config to config.yml ([a460a4e](https://github.com/wmfs/tymly-fastify-plugin/commit/a460a4e256c3ce67595554379d8dc3c1de019bbe))


### 💎 Styles

* **lint:** whitespace fixes ([a132884](https://github.com/wmfs/tymly-fastify-plugin/commit/a13288482c59ddffc1b6084289405676949334ce))

# [1.1.0](https://github.com/wmfs/tymly-fastify-plugin/compare/v1.0.0...v1.1.0) (2020-02-12)


### ✨ Features

* use preValidation to specify which routes to protect ([8701657](https://github.com/wmfs/tymly-fastify-plugin/commit/8701657e5f97db709912f238c8ec63352b83c78e))


### 💎 Styles

* standard --fix ([9d12b04](https://github.com/wmfs/tymly-fastify-plugin/commit/9d12b043a8dda98ca40cebe75533b982cbb90701))

# 1.0.0 (2020-02-12)


### ✨ Features

* initial commit ([8c53230](https://github.com/wmfs/tymly-fastify-plugin/commit/8c53230c34183122299145c7c6c2faabf1630e73))


### 🐛 Bug Fixes

* param name ([16fa50d](https://github.com/wmfs/tymly-fastify-plugin/commit/16fa50d5d3e1e56b6a583f147b9be4c6e6e9e61e))


### ♻️ Chores

* update readme ([65adb51](https://github.com/wmfs/tymly-fastify-plugin/commit/65adb51d7793e5827a86aad609d67180dae2d9a3))


### 💎 Styles

* standard --fix ([6b1b3bd](https://github.com/wmfs/tymly-fastify-plugin/commit/6b1b3bd4976f1ea696bac4c0ca72a31d9c513e80))
