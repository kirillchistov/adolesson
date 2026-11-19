import "@typespec/http";
import "@typespec/openapi";
import "./models.tsp";
import "./routes.tsp";

using Http;

/**
 * Общий стол семьи.
 *
 * Контракт (Design First): эти `.tsp` — источник истины. Из них собирается
 * `docs/api/openapi.yaml`. Личный слой подростка (чек-ины, журнал, блоки,
 * самодиагностика, «Моё») в API нет и не добавляется: сервер такие тела не принимает.
 * Светофор хранит только цвет, без слов из чек-ина.
 */
@service(#{ title: "Общий стол" })
@OpenAPI.info(#{ version: "0.1.0" })
@server("http://localhost:5001", "Локальный сервер разработки")
namespace Adolesson;
