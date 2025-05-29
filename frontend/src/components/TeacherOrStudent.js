import { useNavigate } from "react-router-dom";
import "./TeacherOrStudent.css";

const TeacherOrStudent = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="logo-block">
        <span className="logo-quizly">QUIZLY</span>
        <span className="slogan-quizly">Quick Quizzes. Real Progress</span>
      </div>
      <h2>Welcome!</h2>
      <p>Choose your profile:</p>
      <div className="buttons">
        <button
          className="btn"
          onClick={() =>
            navigate("/signup-form", { state: { role: "teacher" } })
          }
        >
          I'm a teacher
        </button>
        <button
          className="btn"
          onClick={() =>
            navigate("/signup-form", { state: { role: "student" } })
          }
        >
          I'm a student
        </button>
      </div>
    </div>
  );
};

export default TeacherOrStudent;
