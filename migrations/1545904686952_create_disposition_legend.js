module.exports = {
    "up": `
        CREATE TABLE disposition_legend(
          id INT AUTO_INCREMENT,
          name text NOT NULL,
          value INT NOT NULL,
          primary key(id)
        );
        
    `,
    "down": `
        DROP TABLE disposition_legend;
    `
}
