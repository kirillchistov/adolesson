.DEFAULT_GOAL := help

# Прототип — prototype/. Контракт — package.json в корне. API — backend/.
PROTO := prototype

.PHONY: help install dev lint build preview clean spec db api api-test api-image

help:
	@echo "Прототип — в $(PROTO)/. Контракт — npm-пакет в корне. API — в backend/."
	@echo "make install   поставить зависимости прототипа"
	@echo "make dev       локальный сервер прототипа, в том числе по сети"
	@echo "make lint      oxlint"
	@echo "make build     проверка типов и сборка в $(PROTO)/dist/"
	@echo "make preview   собрать и открыть dist/"
	@echo "make clean     удалить $(PROTO)/dist/"
	@echo "make spec      пересобрать docs/api/openapi.yaml из spec/"
	@echo "make db        поднять локальный PostgreSQL"
	@echo "make api       API общего стола, http://127.0.0.1:5001/"
	@echo "make api-test  тесты доступа к общему столу"
	@echo "make api-image образ API для Yandex Cloud"
	@echo "make -C frontend dev   каркас «Моё», http://127.0.0.1:5174/"

install:
	npm install --prefix $(PROTO)

dev:
	npm run dev --prefix $(PROTO)

lint:
	npm run lint --prefix $(PROTO)

build:
	npm run build --prefix $(PROTO)

preview: build
	npm run preview --prefix $(PROTO)

clean:
	rm -rf $(PROTO)/dist

spec:
	npm run spec:build

db:
	docker compose up -d postgres

api:
	npm run dev --prefix backend

api-test:
	npm test --prefix backend

api-image:
	docker build -f backend/Dockerfile -t adolesson-api .
