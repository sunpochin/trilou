| table_name | column_name | data_type                   |
| ---------- | ----------- | --------------------------- |
| cards      | id          | bigint                      |
| cards      | list_id     | uuid                        |
| cards      | title       | text                        |
| cards      | description | text                        |
| cards      | due_date    | timestamp without time zone |
| cards      | position    | bigint                      |
| cards      | created_at  | timestamp with time zone    |
| cards      | status      | text                        |
| lists      | id          | uuid                        |
| lists      | user_id     | uuid                        |
| lists      | title       | text                        |
| lists      | position    | bigint                      |
| lists      | created_at  | timestamp with time zone    |
| users      | id          | uuid                        |
| users      | email       | text                        |
| users      | name        | text                        |
| users      | avatar_url  | text                        |
| users      | created_at  | timestamp with time zone    |