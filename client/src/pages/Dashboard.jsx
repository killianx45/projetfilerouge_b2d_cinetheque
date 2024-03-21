import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [likedFilms, setLikedFilms] = useState([]);
  const [watchedFilms, setWatchedFilms] = useState([]);
  const [watchlistFilms, setWatchlistFilms] = useState([]);
  const [films, setFilms] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:3000/api/films")
      .then((res) => res.json())
      .then((data) => {
        setFilms(data);
      });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
    } else {
      // Fetch user information
      fetch("http://localhost:3000/api/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            setUser(data);

            // Fetch liked films
            fetch("http://localhost:3000/api/user/liked-films", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
              .then((res) => res.json())
              .then((likedData) => {
                if (likedData.success) {
                  setLikedFilms(likedData.likedFilms);
                }
              });

            // Fetch watched films
            fetch("http://localhost:3000/api/user/watched-films", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
              .then((res) => res.json())
              .then((watchedData) => {
                if (watchedData.success) {
                  setWatchedFilms(watchedData.watchedFilms);
                }
              });

            // Fetch watchlist films
            fetch("http://localhost:3000/api/user/watchlist-films", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
              .then((res) => res.json())
              .then((watchlistData) => {
                if (watchlistData.success) {
                  setWatchlistFilms(watchlistData.watchlistFilms);
                }
              });
          } else {
            navigate("/login");
          }
        });
    }
  }, [navigate]);

  if (!user) {
    return null;
  }

  function logout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  function accueil() {
    navigate("/");
  }

  function unLikeFilm(filmId) {
    const token = localStorage.getItem("token");

    fetch("http://localhost:3000/api/user/dislike", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ filmId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("Film retiré de vos favoris !");
        } else {
          alert("Une erreur est survenue.");
        }
      });
  }

  function unwatchFilm(filmId) {
    const token = localStorage.getItem("token");

    fetch("http://localhost:3000/api/user/unwatch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ filmId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("Film retiré de votre liste de films déjà vu !");
        } else {
          alert("Une erreur est survenue.");
        }
      });
  }

  function unwatchlistFilm(filmId) {
    const token = localStorage.getItem("token");

    fetch("http://localhost:3000/api/user/unwatchlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ filmId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("Film retiré de votre watchlist !");
        } else {
          alert("Une erreur est survenue.");
        }
      });
  }

  return (
    <div className="bg-slate-900">
      <div className="flex flex-row justify-center gap-2 ml-5 align-center bg-slate-900">
        <img
          src="src/images/logout.webp"
          alt="logo logout"
          className="p-5 w-1/7"
          onClick={logout}
        />
        <img
          src="src/images/home.webp"
          alt="logo home"
          className="p-5 w-1/7"
          onClick={accueil}
        />
      </div>
      <h1 className="p-5 font-extrabold text-center text-white uppercase">
        Bienvenue sur votre profil, {user.name}
      </h1>
      <div className="flex flex-col justify-center w-full gap-3 align-center bg-slate-900">
        <div className="flex flex-col items-center gap-3 p-2 text-center">
          <h2 className="font-bold text-white uppercase">Vos films likés :</h2>
          <ul className="flex flex-wrap justify-center gap-3 mb-16">
            {films &&
              likedFilms.map((film) => (
                <li
                  className="w-1/3 h-full p-1 text-center rounded"
                  key={film._id}
                >
                  <img
                    src={
                      film.posterPath
                        ? `https://image.tmdb.org/t/p/w500${film.posterPath}`
                        : "src/images/endgame.jpg"
                    }
                    alt={film.titre}
                    className="object-cover w-full h-full rounded-lg"
                  />{" "}
                  <div className="flex flex-row justify-center gap-2 mt-3">
                    <img
                      src="src/images/love.webp"
                      alt="icone love film"
                      onClick={() => unLikeFilm(film._id)}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </div>
                </li>
              ))}
          </ul>
        </div>
        <div className="flex flex-col items-center gap-3 p-2 text-center">
          <h2 className="font-bold text-white uppercase">
            Vos films déja vus :
          </h2>
          <ul className="flex flex-wrap justify-center gap-3 mb-16">
            {films &&
              watchedFilms.map((film) => (
                <li
                  className="w-1/3 h-full p-1 text-center rounded"
                  key={film._id}
                >
                  <img
                    src={
                      film.posterPath
                        ? `https://image.tmdb.org/t/p/w500${film.posterPath}`
                        : "src/images/endgame.jpg"
                    }
                    alt={film.titre}
                    className="object-cover w-full h-full rounded-lg"
                  />{" "}
                  <div className="flex flex-row justify-center gap-2 mt-3">
                    <img
                      src="src/images/watch.webp"
                      alt="icone watch film"
                      onClick={() => unwatchFilm(film._id)}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </div>
                </li>
              ))}
          </ul>
        </div>
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="font-bold text-white uppercase">Vos films à voir :</h2>
          <ul className="flex flex-wrap justify-center gap-3 mb-16">
            {films &&
              watchlistFilms.map((film) => (
                <li
                  className="w-1/3 h-full p-1 text-center rounded"
                  key={film._id}
                >
                  <img
                    src={
                      film.posterPath
                        ? `https://image.tmdb.org/t/p/w500${film.posterPath}`
                        : "src/images/endgame.jpg"
                    }
                    alt={film.titre}
                    className="object-cover w-full h-full rounded-lg"
                  />{" "}
                  <div className="flex flex-row justify-center gap-2 mt-3">
                    <img
                      src="src/images/towatch.webp"
                      alt="icone watchlist film"
                      onClick={() => unwatchlistFilm(film._id)}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </div>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
