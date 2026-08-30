-- Preserve the existing project APIs while exposing the isolated blog schema.
alter role authenticator set pgrst.db_schemas = 'public, graphql_public, blog';
notify pgrst, 'reload config';
notify pgrst, 'reload schema';
