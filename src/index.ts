import express from "express";
import { Pool } from "pg";

const app = express();
const PORT = 3000;

app.use(express.json());

const pool = new Pool({
  connectionString:
    "postgresql://prac_owner:EBW9yXTLA3iQ@ep-gentle-king-a1hei6x9.ap-southeast-1.aws.neon.tech/prac?sslmode=require",
});

(async () => {
  const client = await pool.connect();
  try {
    await client.query(`
        CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE
      )
    `);

    console.log("User table created successfully");
  } catch (error) {
    console.error("Error creating user table:", error);
  } finally {
    client.release();
  }
})();

enum StatusCode {
  Success = 200,
  Create = 201,
  InternalServerError = 500,
}

app.get("/api/users", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM users");
    res.status(StatusCode.Success).json(rows);
  } catch (error) {
    res
      .status(StatusCode.InternalServerError)
      .json({ error: "Internal server error" });
  }
});

app.post("/api/users", async (req, res) => {
  const { name, email } = req.body;
  try {
    const { rows } = await pool.query(
      "INSERT INTO users(name, email) VALUES($1, $2) RETURNING *",
      [name, email]
    );
    res.status(StatusCode.Create).json(rows[0]);
  } catch (error) {
    console.log(error);
    res
      .status(StatusCode.InternalServerError)
      .json({ error: "Internal server error" });
  }
});

app.put("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    const { rows } = await pool.query(
      "UPDATE users SET name= $1 WHERE id = $2 RETURNING *",
      [name, id]
    );
    res.status(StatusCode.Success).json(rows[0]);
  } catch (error) {
    res
      .status(StatusCode.InternalServerError)
      .json({ error: "Internal server error" });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM users WHERE id = $1", [id]);
    res.sendStatus(StatusCode.Success).json({ message: "Deleted Succesfully" });
  } catch (error) {
    res.status(StatusCode.InternalServerError);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
