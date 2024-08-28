# pretoml - A simple preprocessor for .toml files

This package allows you to insert environment variables into your .toml files.

Just rename your file from "myfile.toml" to "myfile.pre.toml"

Insert any environment variable as "{{ MY_ENV }}"

The script will then find all envs and replace them with their value and output a new .toml file.

## Usage

```
pretoml process <file or folder>
```

## Installation

```
npm i -D git@github.com:beeclever/pretoml.git
```