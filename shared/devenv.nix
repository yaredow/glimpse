{ pkgs, ... }:

{
  packages = [
    pkgs.postgresql_16
  ];

  # Shared PostgreSQL Service
  services.postgres = {
    enable = true;
    package = pkgs.postgresql_16;
    listen_addresses = "127.0.0.1";
    port = 5432;
    initialDatabases = [
      { name = "glimpse"; }
    ];
    initialScript = ''
      CREATE USER glimpse WITH SUPERUSER PASSWORD 'glimpse_dev';
      GRANT ALL PRIVILEGES ON DATABASE glimpse TO glimpse;
    '';
  };
}

