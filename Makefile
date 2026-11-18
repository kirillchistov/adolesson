.DEFAULT_GOAL := help

# package.json лежит в prototype/, не в корне репозитория.
PROTO := prototype

.PHONY: help install dev lint build preview clean

help:
	@echo "Команды из корня репозитория. Зависимости и скрипты — в $(PROTO)/."
	@echo "make install   поставить зависимости прототипа"
	@echo "make dev       локальный сервер, в том числе по сети"
	@echo "make lint      oxlint"
	@echo "make build     проверка типов и сборка в $(PROTO)/dist/"
	@echo "make preview   собрать и открыть dist/"
	@echo "make clean     удалить $(PROTO)/dist/"
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
